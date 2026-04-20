import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';
import { AuditActionType, LeaveRequestStatus } from '@/lib/prisma';

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
      if (typeof body.status !== 'string' || !Object.values(LeaveRequestStatus).includes(body.status as LeaveRequestStatus)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status value' },
          { status: 400 }
        );
      }
      updates.status = body.status as LeaveRequestStatus;
    }

    if ('reason' in body) {
      if (typeof body.reason !== 'string' || body.reason.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'reason must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.reason = body.reason;
    }

    if ('approvalNotes' in body) {
      if (body.approvalNotes !== null && body.approvalNotes !== undefined && typeof body.approvalNotes !== 'string') {
        return NextResponse.json(
          { success: false, error: 'approvalNotes must be a string or null' },
          { status: 400 }
        );
      }
      updates.approvalNotes = (body.approvalNotes as string | null | undefined) ?? null;
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

    if (candidateStartDate >= candidateEndDate) {
      return NextResponse.json(
        { success: false, error: 'startDate must be before endDate' },
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

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: updates,
      include: {
        employee: { include: { user: true } },
        leaveType: true,
        approver: true,
      },
    });

    const auditUserId = await getAuditUserId(request);
    const actionType =
      updates.status === LeaveRequestStatus.APPROVED
        ? AuditActionType.APPROVE
        : updates.status === LeaveRequestStatus.REJECTED
          ? AuditActionType.REJECT
          : updates.status === LeaveRequestStatus.CANCELLED
            ? AuditActionType.CANCEL
            : AuditActionType.UPDATE;
    await prisma.auditLog.create({
      data: {
        actionType,
        userId: auditUserId,
        employeeId: updatedRequest.employeeId,
        leaveRequestId: updatedRequest.id,
        description: `Updated leave request ${updatedRequest.id}${updates.status ? ` to ${updates.status}` : ''}`,
        changes: JSON.stringify({
          before: {
            status: existing.status,
            reason: existing.reason,
            startDate: existing.startDate,
            endDate: existing.endDate,
            durationDays: existing.durationDays,
            approvalNotes: existing.approvalNotes,
            approvedBy: existing.approvedBy,
          },
          updates,
        }),
      },
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
    const cancelledRequest = await prisma.leaveRequest.update({
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

    await prisma.auditLog.create({
      data: {
        actionType: 'CANCEL',
        userId: auditUserId,
        employeeId: cancelledRequest.employeeId,
        leaveRequestId: cancelledRequest.id,
        description: `Cancelled leave request ${cancelledRequest.id}`,
        changes: JSON.stringify({
          fromStatus: existing.status,
          toStatus: LeaveRequestStatus.CANCELLED,
        }),
      },
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
