import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId, captureAuditChanges } from '@/lib/audit';
import { AuditActionType, LeaveRequestStatus } from '@/lib/prisma';
import { authorize, authorizeOwnership, getAuthContext } from '@/lib/auth-utils';
import { HolidayEngine } from '@/lib/holiday-engine';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const parsedLimit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
    const limit = Number.isNaN(parsedLimit) || parsedLimit < 1 ? 10 : parsedLimit;
    const status = searchParams.get('status');
    const employeeIdFilter = searchParams.get('employeeId');
    const includeSummary = searchParams.get('includeSummary') === 'true';

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      if (!Object.values(LeaveRequestStatus).includes(status as LeaveRequestStatus)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status filter' },
          { status: 400 }
        );
      }
      where.status = status as LeaveRequestStatus;
    }

    const canManageUsers = auth.permissions.some(
      (permission) => permission.action === 'MANAGE' && permission.resource === 'USER'
    );
    const canApproveRequests = auth.permissions.some(
      (permission) => permission.action === 'APPROVE' && permission.resource === 'LEAVE_REQUEST'
    );

    // Dynamic RBAC filtering
    if (canManageUsers) {
      if (employeeIdFilter) where.employeeId = employeeIdFilter;
    } else if (canApproveRequests) {
      // Managers see their own + subordinates
      if (employeeIdFilter) {
        const targetEmployee = await prisma.employee.findUnique({ where: { id: employeeIdFilter } });
        if (!targetEmployee || (targetEmployee.managerId !== auth.userId && targetEmployee.userId !== auth.userId)) {
          return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
        where.employeeId = employeeIdFilter;
      } else {
        // Show all subordinates + self
        where.OR = [
          { employee: { managerId: auth.userId } },
          { employee: { userId: auth.userId } }
        ];
      }
    } else {
      // Employees only see their own requests
      const employee = await prisma.employee.findUnique({ where: { userId: auth.userId } });
      if (!employee) {
        return NextResponse.json({ success: false, error: 'Employee profile not found' }, { status: 404 });
      }
      if (employeeIdFilter && employeeIdFilter !== employee.id) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
      where.employeeId = employee.id;
    }

    const summaryPromise = includeSummary
      ? prisma.leaveRequest.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        })
      : Promise.resolve(null);


    const [requests, total, groupedSummary] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
            include: { user: true }
          },
          leaveType: true,
          approver: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.leaveRequest.count({ where }),
      summaryPromise,
    ]);

    const summary = {
      [LeaveRequestStatus.DRAFT]: 0,
      [LeaveRequestStatus.SUBMITTED]: 0,
      [LeaveRequestStatus.APPROVED]: 0,
      [LeaveRequestStatus.REJECTED]: 0,
      [LeaveRequestStatus.CANCELLED]: 0,
    };

    if (groupedSummary) {
      for (const row of groupedSummary) {
        summary[row.status as LeaveRequestStatus] = row._count._all;
      }
    }

    return NextResponse.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      ...(includeSummary ? { summary } : {}),
    });

  } catch (error) {
    console.error('[Requests API - GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const permissionAuth = await authorize(request, [
      { action: 'CREATE', resource: 'LEAVE_REQUEST' },
      { action: 'READ', resource: 'LEAVE_TYPE' },
    ]);
    if ('errorResponse' in permissionAuth) return permissionAuth.errorResponse;

    const body = await request.json() as Record<string, unknown>;
    const employeeId = body.employeeId as string;

    const leaveTypeId = body.leaveTypeId;
    const startDateInput = body.startDate;
    const endDateInput = body.endDate;
    const durationDays = body.durationDays;
    const reason = body.reason;


    if (typeof employeeId !== 'string' || employeeId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'employeeId is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // RBAC: Ensure user owns this employee profile or has global manage access
    const authResult = await authorizeOwnership(request, employeeId, false);
    if ('errorResponse' in authResult) return authResult.errorResponse;

    if (typeof leaveTypeId !== 'string' || leaveTypeId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'leaveTypeId is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'reason is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof durationDays !== 'number' || Number.isNaN(durationDays) || durationDays <= 0) {
      return NextResponse.json(
        { success: false, error: 'durationDays must be a positive number' },
        { status: 400 }
      );
    }

    const startDate = new Date(String(startDateInput));
    const endDate = new Date(String(endDateInput));
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid startDate' },
        { status: 400 }
      );
    }
    if (Number.isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid endDate' },
        { status: 400 }
      );
    }

    // Validation: Start date must be today or future (LBS-004-004)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    if (startDate < today) {
      return NextResponse.json(
        { success: false, error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    // Validation: End date must be strictly after start date (LBS-004-005)
    if (endDate < startDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after or same as start date' },
        { status: 400 }
      );
    }

    // Recalculate durationDays excluding weekends and holidays using HolidayEngine
    const calculatedDurationDays = await HolidayEngine.calculateNetDuration(startDate, endDate);

    if (calculatedDurationDays <= 0) {
      return NextResponse.json(
        { success: false, error: 'Selected date range contains no working days' },
        { status: 400 }
      );
    }

    // Check employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check leave type exists
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: leaveTypeId }
    });

    if (!leaveType) {
      return NextResponse.json(
        { success: false, error: 'Leave type not found' },
        { status: 404 }
      );
    }

    // Validation: Gender-based leave restrictions (LBS-004-007)
    const leaveName = leaveType.name.toLowerCase();
    if (leaveName.includes('maternity') && employee.gender !== 'FEMALE') {
      return NextResponse.json(
        { success: false, error: 'Maternity leave is only available to female employees.' },
        { status: 400 }
      );
    }
    if (leaveName.includes('paternity') && employee.gender !== 'MALE') {
      return NextResponse.json(
        { success: false, error: 'Paternity leave is only available to male employees.' },
        { status: 400 }
      );
    }

    const balanceRecord = await prisma.balanceRecord.findFirst({
      where: {
        employeeId,
        leaveTypeId,
        year: startDate.getFullYear(),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!balanceRecord) {
      return NextResponse.json(
        { success: false, error: 'No balance record found for this leave type and year' },
        { status: 400 }
      );
    }

    // Validation: Insufficient balance (LBS-004-006)
    if (balanceRecord.closingBalance < calculatedDurationDays) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient leave balance. Available: ${balanceRecord.closingBalance}, Requested: ${calculatedDurationDays}` 
        },
        { status: 400 }
      );
    }

    // Create request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId,
        balanceRecordId: balanceRecord.id,
        startDate,
        endDate,
        durationDays: calculatedDurationDays,
        reason: reason.trim(),
        status: 'DRAFT',
        createdAt: new Date()
      },
      include: {
        employee: {
          include: { user: true }
        },
        leaveType: true
      }
    });

    // Create audit log
    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'CREATE',
        userId: auditUserId,
        employeeId,
        leaveRequestId: leaveRequest.id,
        description: `Created leave request ${leaveRequest.id} for employee ${employee.id}`,
        changes: JSON.stringify(captureAuditChanges({}, body, leaveRequest)),
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: leaveRequest,
        message: 'Leave request created successfully'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[Requests API - POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const { id, ...updateData } = body;

    if (typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const updates: {
      status?: LeaveRequestStatus;
      reason?: string;
      approvalNotes?: string | null;
      approvedBy?: string | null;
      approvalDate?: Date | null;
    } = {};

    if ('status' in updateData) {
      const nextStatus = updateData.status;
      if (typeof nextStatus !== 'string' || !Object.values(LeaveRequestStatus).includes(nextStatus as LeaveRequestStatus)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status value' },
          { status: 400 }
        );
      }
      updates.status = nextStatus as LeaveRequestStatus;
    }

    if ('reason' in updateData) {
      const nextReason = updateData.reason;
      if (typeof nextReason !== 'string' || nextReason.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Reason must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.reason = nextReason;
    }

    if ('approvalNotes' in updateData) {
      const notes = updateData.approvalNotes;
      if (notes !== null && notes !== undefined && typeof notes !== 'string') {
        return NextResponse.json(
          { success: false, error: 'approvalNotes must be a string or null' },
          { status: 400 }
        );
      }
      updates.approvalNotes = (notes as string | null | undefined) ?? null;
    }

    if ('approvedBy' in updateData) {
      const approvedBy = updateData.approvedBy;
      if (approvedBy !== null && approvedBy !== undefined && typeof approvedBy !== 'string') {
        return NextResponse.json(
          { success: false, error: 'approvedBy must be a string or null' },
          { status: 400 }
        );
      }
      if (typeof approvedBy === 'string' && approvedBy.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'approvedBy cannot be an empty string' },
          { status: 400 }
        );
      }
      updates.approvedBy = typeof approvedBy === 'string' ? approvedBy.trim() : (approvedBy as null | undefined) ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    const oldRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!oldRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
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
          employee: {
            include: { user: true }
          },
          leaveType: true
        }
      });

      // Handle Balance Adjustments
      const isNowApproved = updated.status === LeaveRequestStatus.APPROVED;
      const wasApproved = oldRequest.status === LeaveRequestStatus.APPROVED;

      if (isNowApproved && !wasApproved) {
        // Double check balance at time of approval
        const currentBalance = await tx.balanceRecord.findUnique({
          where: { id: updated.balanceRecordId }
        });

        if (!currentBalance || currentBalance.closingBalance < updated.durationDays) {
          throw new Error(`Insufficient leave balance for approval. Available: ${currentBalance?.closingBalance ?? 0}, Required: ${updated.durationDays}`);
        }

        // Transition to APPROVED: Deduct days
        await tx.balanceRecord.update({
          where: { id: updated.balanceRecordId },
          data: {
            used: { increment: updated.durationDays },
            closingBalance: { decrement: updated.durationDays },
          },
        });
      } else if (!isNowApproved && wasApproved) {
        // Transition from APPROVED: Revert deduction
        await tx.balanceRecord.update({
          where: { id: updated.balanceRecordId },
          data: {
            used: { decrement: updated.durationDays },
            closingBalance: { increment: updated.durationDays },
          },
        });
      }

      const updateAuditUserId = await getAuditUserId(request);
      const actionType =
        updates.status === LeaveRequestStatus.APPROVED
          ? AuditActionType.APPROVE
          : updates.status === LeaveRequestStatus.REJECTED
            ? AuditActionType.REJECT
            : updates.status === LeaveRequestStatus.CANCELLED
              ? AuditActionType.CANCEL
              : AuditActionType.UPDATE;

      await tx.auditLog.create({
        data: {
          actionType,
          userId: updateAuditUserId,
          employeeId: updated.employeeId,
          leaveRequestId: id,
          description: `Leave request ${id} updated via collection PATCH${updates.status ? ` to ${updates.status}` : ''}`,
          changes: JSON.stringify(captureAuditChanges(oldRequest, updates, updated)),
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: 'Leave request updated successfully'
    });


  } catch (error) {
    console.error('[Requests API - PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update request' },
      { status: 500 }
    );
  }
}
