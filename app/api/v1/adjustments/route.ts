import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/v1/adjustments - Fetch all balance adjustments
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    const adjustmentType = searchParams.get('adjustmentType');
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '10');

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (adjustmentType) where.adjustmentType = adjustmentType;

    const [adjustments, total] = await Promise.all([
      prisma.balanceAdjustment.findMany({
        where,
        include: { employee: { include: { user: true } }, leaveType: true, approver: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.balanceAdjustment.count({ where }),
    ]);

    return NextResponse.json(
      { adjustments, total, page: Math.floor(skip / take) + 1, pageSize: take },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching adjustments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adjustments' },
      { status: 500 }
    );
  }
}

// POST /api/v1/adjustments - Create balance adjustment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employeeId,
      leaveTypeId,
      adjustmentType,
      adjustmentDays,
      reason,
      approvedBy,
      effectiveDate,
    } = body;

    // Validation
    if (!employeeId || !leaveTypeId || adjustmentDays === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify employee and leave type exist
    const [employee, leaveType] = await Promise.all([
      prisma.employee.findUnique({ where: { id: employeeId } }),
      prisma.leaveType.findUnique({ where: { id: leaveTypeId } }),
    ]);

    if (!employee || !leaveType) {
      return NextResponse.json(
        { error: 'Employee or leave type not found' },
        { status: 404 }
      );
    }

    const adjustment = await prisma.balanceAdjustment.create({
      data: {
        employeeId,
        leaveTypeId,
        adjustmentType: adjustmentType || 'correction',
        adjustmentDays,
        reason: reason || 'Manual adjustment',
        approvedBy: approvedBy || request.headers.get('x-user-id') || 'system',
        approvalDate: new Date(),
        effectiveDate: new Date(effectiveDate || new Date()),
      },
      include: { employee: { include: { user: true } }, leaveType: true, approver: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actionType: 'ADJUSTMENT',
        userId: approvedBy || request.headers.get('x-user-id') || 'system',
        employeeId,
        adjustmentId: adjustment.id,
        description: `Balance adjustment: ${adjustmentType} of ${adjustmentDays} days for ${leaveType.name}`,
      },
    });

    return NextResponse.json(adjustment, { status: 201 });
  } catch (error) {
    console.error('Error creating adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to create adjustment' },
      { status: 500 }
    );
  }
}
