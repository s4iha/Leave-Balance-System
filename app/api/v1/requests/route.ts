import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';
import { AuditActionType, LeaveRequestStatus } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const parsedLimit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
    const limit = Number.isNaN(parsedLimit) || parsedLimit < 1 ? 10 : parsedLimit;
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
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
    if (employeeId) where.employeeId = employeeId;

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
    const body = await request.json() as Record<string, unknown>;
    const employeeId = body.employeeId;
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

    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date must be before end date' },
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

    // Create request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId,
        balanceRecordId: balanceRecord.id,
        startDate,
        endDate,
        durationDays,
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
        changes: JSON.stringify({
          leaveTypeId,
          durationDays,
          reason: reason.trim(),
          startDate,
          endDate,
          status: leaveRequest.status,
        })
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

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: updates,
      include: {
        employee: {
          include: { user: true }
        },
        leaveType: true
      }
    });

    // Create audit log
    const updateAuditUserId = await getAuditUserId(request);
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
        userId: updateAuditUserId,
        employeeId: updatedRequest.employeeId,
        leaveRequestId: id,
        description: `Leave request ${id} updated via collection PATCH${updates.status ? ` to ${updates.status}` : ''}`,
        changes: JSON.stringify({
          before: {
            status: oldRequest.status,
            reason: oldRequest.reason,
            approvalNotes: oldRequest.approvalNotes,
            approvedBy: oldRequest.approvedBy,
          },
          updates,
          after: {
            status: updatedRequest.status,
            reason: updatedRequest.reason,
            approvalNotes: updatedRequest.approvalNotes,
            approvedBy: updatedRequest.approvedBy,
          },
        }),
      },
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
