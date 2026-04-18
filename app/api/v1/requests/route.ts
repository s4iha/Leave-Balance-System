import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const [requests, total] = await Promise.all([
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
      prisma.leaveRequest.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
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
    const body = await request.json();

    // Validate required fields
    const required = ['employeeId', 'leaveTypeId', 'startDate', 'endDate', 'durationDays', 'reason'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate dates
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Check employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: body.employeeId }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check leave type exists
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: body.leaveTypeId }
    });

    if (!leaveType) {
      return NextResponse.json(
        { success: false, error: 'Leave type not found' },
        { status: 404 }
      );
    }

    const balanceRecord = await prisma.balanceRecord.findFirst({
      where: {
        employeeId: body.employeeId,
        leaveTypeId: body.leaveTypeId,
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
        employeeId: body.employeeId,
        leaveTypeId: body.leaveTypeId,
        balanceRecordId: balanceRecord.id,
        startDate,
        endDate,
        durationDays: body.durationDays,
        reason: body.reason,
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
        employeeId: body.employeeId,
        description: `Leave request created for ${employee.id} from ${body.startDate} to ${body.endDate}`,
        changes: JSON.stringify({
          leaveTypeId: body.leaveTypeId,
          durationDays: body.durationDays,
          reason: body.reason
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
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Only allow status and reason updates
    const allowedUpdates = ['status', 'reason'];
    const updates: any = {};

    for (const key of allowedUpdates) {
      if (key in updateData) {
        updates[key] = updateData[key];
      }
    }

    const oldRequest = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!oldRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
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
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: updateAuditUserId,
        description: `Leave request ${id} updated`,
        changes: JSON.stringify({
          before: oldRequest,
          after: updatedRequest
        })
      }
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
