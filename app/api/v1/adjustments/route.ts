import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';

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
    const body = await request.json() as Record<string, unknown>;
    const {
      employeeId,
      leaveTypeId,
      adjustmentType,
      adjustmentDays,
      reason,
      approvedBy,
      effectiveDate,
    } = body;

    if (typeof employeeId !== 'string' || employeeId.trim().length === 0) {
      return NextResponse.json(
        { error: 'employeeId is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof leaveTypeId !== 'string' || leaveTypeId.trim().length === 0) {
      return NextResponse.json(
        { error: 'leaveTypeId is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof adjustmentType !== 'string' || adjustmentType.trim().length === 0) {
      return NextResponse.json(
        { error: 'adjustmentType is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'reason is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof adjustmentDays !== 'number' || Number.isNaN(adjustmentDays)) {
      return NextResponse.json(
        { error: 'adjustmentDays must be a valid number' },
        { status: 400 }
      );
    }

    if (adjustmentDays === 0) {
      return NextResponse.json(
        { error: 'adjustmentDays cannot be zero' },
        { status: 400 }
      );
    }

    let parsedEffectiveDate: Date | null = null;
    if (effectiveDate !== undefined && effectiveDate !== null) {
      if (typeof effectiveDate !== 'string' || effectiveDate.trim().length === 0) {
        return NextResponse.json(
          { error: 'effectiveDate must be a valid date string when provided' },
          { status: 400 }
        );
      }

      parsedEffectiveDate = new Date(effectiveDate);
      if (Number.isNaN(parsedEffectiveDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid effectiveDate value' },
          { status: 400 }
        );
      }
    }

    // Verify employee and leave type exist
    const [employee, leaveType] = await Promise.all([
      prisma.employee.findUnique({ where: { id: employeeId } }),
      prisma.leaveType.findUnique({ where: { id: leaveTypeId } }),
    ]);

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    if (!leaveType) {
      return NextResponse.json(
        { error: 'Leave type not found' },
        { status: 404 }
      );
    }

    const auditUserId = await getAuditUserId(request);
    if (
      approvedBy !== undefined &&
      approvedBy !== null &&
      (typeof approvedBy !== 'string' || approvedBy.trim().length === 0)
    ) {
      return NextResponse.json(
        { error: 'approvedBy must be a non-empty string when provided' },
        { status: 400 }
      );
    }

    const resolvedApproverId = typeof approvedBy === 'string' ? approvedBy.trim() : auditUserId;
    const approver = await prisma.user.findUnique({
      where: { id: resolvedApproverId },
      select: { id: true },
    });

    if (!approver) {
      return NextResponse.json(
        { error: 'Approver user not found' },
        { status: 404 }
      );
    }

    const adjustment = await prisma.balanceAdjustment.create({
      data: {
        employeeId,
        leaveTypeId,
        adjustmentType: adjustmentType.trim(),
        adjustmentDays,
        reason: reason.trim(),
        approvedBy: resolvedApproverId,
        approvalDate: new Date(),
        effectiveDate: parsedEffectiveDate ?? new Date(),
      },
      include: { employee: { include: { user: true } }, leaveType: true, approver: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actionType: 'ADJUSTMENT',
        userId: auditUserId,
        employeeId,
        adjustmentId: adjustment.id,
        description: `Created balance adjustment ${adjustment.id}: ${adjustment.adjustmentType} ${adjustment.adjustmentDays} days for ${leaveType.name}`,
        changes: JSON.stringify({
          adjustmentType: adjustment.adjustmentType,
          adjustmentDays: adjustment.adjustmentDays,
          reason: adjustment.reason,
          approvedBy: adjustment.approvedBy,
          effectiveDate: adjustment.effectiveDate,
        }),
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
