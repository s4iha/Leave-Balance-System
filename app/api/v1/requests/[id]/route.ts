import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';
import { AuditActionType, LeaveRequestStatus } from '@/lib/prisma';
import { authorize, authorizeOwnership, getAuthContext } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: { include: { user: true } },
        leaveType: true,
        approver: true,
      },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    // RBAC: Must be owner, manager, or admin
    const authResult = await authorizeOwnership(request, leaveRequest.employeeId, true);
    if ('errorResponse' in authResult) return authResult.errorResponse;

    return NextResponse.json(
      { success: true, data: leaveRequest },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Requests API - GET by id] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: { include: { user: true } }, leaveType: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    // RBAC Logic
    const isOwner = existing.employee.userId === auth.userId;
    const isManager = existing.employee.managerId === auth.userId;
    const canManageUsers = auth.permissions.some(
      (permission) => permission.action === 'MANAGE' && permission.resource === 'USER'
    );

    if (!isOwner && !isManager && !canManageUsers) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const updates: {
      status?: LeaveRequestStatus;
      reason?: string;
      approvalNotes?: string | null;
      approvedBy?: string | null;
      approvalDate?: Date | null;
      startDate?: Date;
      endDate?: Date;
      durationDays?: number;
    } = {};

    if ('status' in body) {
      const nextStatus = body.status as LeaveRequestStatus;
      // Approval/Rejection: Only Manager/Admin
      if ((nextStatus === LeaveRequestStatus.APPROVED || nextStatus === LeaveRequestStatus.REJECTED) && !isManager && !canManageUsers) {
        return NextResponse.json({ success: false, error: 'Only managers or admins can approve/reject requests' }, { status: 403 });
      }
      // Submission/Draft: Only Owner
      if ((nextStatus === LeaveRequestStatus.SUBMITTED || nextStatus === LeaveRequestStatus.DRAFT) && !isOwner && !canManageUsers) {
        return NextResponse.json({ success: false, error: 'Only the employee can submit their request' }, { status: 403 });
      }
      
      if (typeof body.status !== 'string' || !Object.values(LeaveRequestStatus).includes(body.status as LeaveRequestStatus)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status value' },
          { status: 400 }
        );
      }
      updates.status = body.status as LeaveRequestStatus;
    }


    if ('approvedBy' in body) {
      if (body.approvedBy !== null && body.approvedBy !== undefined && typeof body.approvedBy !== 'string') {
        return NextResponse.json(
          { success: false, error: 'approvedBy must be a string or null' },
          { status: 400 }
        );
      }
      if (typeof body.approvedBy === 'string' && body.approvedBy.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'approvedBy cannot be an empty string' },
          { status: 400 }
        );
      }
      updates.approvedBy = typeof body.approvedBy === 'string'
        ? body.approvedBy.trim()
        : (body.approvedBy as string | null | undefined) ?? null;
    }

    const candidateStartDate =
      'startDate' in body
        ? new Date(String(body.startDate))
        : existing.startDate;
    const candidateEndDate =
      'endDate' in body
        ? new Date(String(body.endDate))
        : existing.endDate;

    if ('startDate' in body) {
      if (Number.isNaN(candidateStartDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid startDate' },
          { status: 400 }
        );
      }
      updates.startDate = candidateStartDate;
    }

    if ('endDate' in body) {
      if (Number.isNaN(candidateEndDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid endDate' },
          { status: 400 }
        );
      }
      updates.endDate = candidateEndDate;
    }

    if (candidateStartDate > candidateEndDate) {
      return NextResponse.json(
        { success: false, error: 'startDate must be before or equal to endDate' },
        { status: 400 }
      );
    }

    if ('durationDays' in body) {
      if (typeof body.durationDays !== 'number' || Number.isNaN(body.durationDays) || body.durationDays <= 0) {
        return NextResponse.json(
          { success: false, error: 'durationDays must be a positive number' },
          { status: 400 }
        );
      }
      updates.durationDays = body.durationDays;
    }

    if (updates.approvedBy) {
      const approver = await prisma.user.findUnique({
        where: { id: updates.approvedBy },
        select: { id: true },
      });

      if (!approver) {
        return NextResponse.json(
          { success: false, error: 'Approver user not found' },
          { status: 404 }
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    if (
      updates.status &&
      (
        updates.status === LeaveRequestStatus.APPROVED ||
        updates.status === LeaveRequestStatus.REJECTED ||
        updates.status === LeaveRequestStatus.CANCELLED
      )
    ) {
      if (updates.approvedBy === null) {
        return NextResponse.json(
          { success: false, error: 'approvedBy cannot be null for approved, rejected, or cancelled status updates' },
          { status: 400 }
        );
      }
      updates.approvalDate = new Date();
      if (updates.approvedBy === undefined) {
        updates.approvedBy = await getAuditUserId(request);
      }
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id },
        data: updates,
        include: {
          employee: { include: { user: true } },
          leaveType: true,
          approver: true,
        },
      });

      // Handle Balance Adjustments
      const isNowApproved = updated.status === LeaveRequestStatus.APPROVED;
      const wasApproved = existing.status === LeaveRequestStatus.APPROVED;

      if (isNowApproved && !wasApproved) {
        // Transition to APPROVED: Deduct days from used and update closing balance
        await tx.balanceRecord.update({
          where: { id: updated.balanceRecordId },
          data: {
            used: { increment: updated.durationDays },
            closingBalance: { decrement: updated.durationDays },
          },
        });
      } else if (!isNowApproved && wasApproved) {
        // Transition from APPROVED: Revert the deduction
        await tx.balanceRecord.update({
          where: { id: updated.balanceRecordId },
          data: {
            used: { decrement: updated.durationDays },
            closingBalance: { increment: updated.durationDays },
          },
        });
      }

      const auditUserId = await getAuditUserId(request);
      const actionType =
        updates.status === LeaveRequestStatus.APPROVED
          ? AuditActionType.APPROVE
          : updates.status === LeaveRequestStatus.REJECTED
            ? AuditActionType.REJECT
            : updates.status === LeaveRequestStatus.CANCELLED
              ? AuditActionType.CANCEL
              : AuditActionType.UPDATE;

      const { captureAuditChanges } = await import('@/lib/audit');

      await tx.auditLog.create({
        data: {
          actionType,
          userId: auditUserId,
          employeeId: updated.employeeId,
          leaveRequestId: updated.id,
          description: `Updated leave request ${updated.id}${updates.status ? ` to ${updates.status}` : ''}`,
          changes: JSON.stringify(captureAuditChanges(existing, updates, updated)),
        },
      });

      return updated;
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedRequest,
        message: 'Leave request updated successfully',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[Requests API - PATCH by id] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: { include: { user: true } },
        leaveType: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    if (existing.status === LeaveRequestStatus.CANCELLED) {
      return NextResponse.json(
        { success: true, data: existing, message: 'Leave request already cancelled' },
        { status: 200 }
      );
    }

    const auditUserId = await getAuditUserId(request);
    const cancelledRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveRequestStatus.CANCELLED,
          approvedBy: existing.approvedBy ?? auditUserId,
          approvalDate: new Date(),
          approvalNotes: existing.approvalNotes ?? 'Cancelled via DELETE /api/v1/requests/[id]',
        },
        include: {
          employee: { include: { user: true } },
          leaveType: true,
          approver: true,
        },
      });

      // If the request was already APPROVED, revert the balance deduction
      if (existing.status === LeaveRequestStatus.APPROVED) {
        await tx.balanceRecord.update({
          where: { id: updated.balanceRecordId },
          data: {
            used: { decrement: updated.durationDays },
            closingBalance: { increment: updated.durationDays },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actionType: 'CANCEL',
          userId: auditUserId,
          employeeId: updated.employeeId,
          leaveRequestId: updated.id,
          description: `Cancelled leave request ${updated.id}`,
          changes: JSON.stringify({
            fromStatus: existing.status,
            toStatus: LeaveRequestStatus.CANCELLED,
          }),
        },
      });

      return updated;
    });

    return NextResponse.json(
      {
        success: true,
        data: cancelledRequest,
        message: 'Leave request cancelled successfully',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[Requests API - DELETE by id] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel request' },
      { status: 500 }
    );
  }
}
