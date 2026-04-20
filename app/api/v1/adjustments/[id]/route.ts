import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adjustment = await prisma.balanceAdjustment.findUnique({
      where: { id },
      include: {
        employee: { include: { user: true } },
        leaveType: true,
        approver: true,
      },
    });

    if (!adjustment) {
      return NextResponse.json({ error: 'Adjustment not found' }, { status: 404 });
    }

    return NextResponse.json(adjustment, { status: 200 });
  } catch (error) {
    console.error('Error fetching adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adjustment' },
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

    const existing = await prisma.balanceAdjustment.findUnique({
      where: { id },
      include: { leaveType: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Adjustment not found' }, { status: 404 });
    }

    const updates: {
      adjustmentType?: string;
      adjustmentDays?: number;
      reason?: string;
      approvedBy?: string;
      approvalDate?: Date;
      effectiveDate?: Date;
    } = {};

    if ('adjustmentType' in body) {
      if (typeof body.adjustmentType !== 'string' || body.adjustmentType.trim().length === 0) {
        return NextResponse.json(
          { error: 'adjustmentType must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.adjustmentType = body.adjustmentType.trim();
    }

    if ('adjustmentDays' in body) {
      if (typeof body.adjustmentDays !== 'number' || Number.isNaN(body.adjustmentDays)) {
        return NextResponse.json(
          { error: 'adjustmentDays must be a valid number' },
          { status: 400 }
        );
      }
      if (body.adjustmentDays === 0) {
        return NextResponse.json(
          { error: 'adjustmentDays cannot be zero' },
          { status: 400 }
        );
      }
      updates.adjustmentDays = body.adjustmentDays;
    }

    if ('reason' in body) {
      if (typeof body.reason !== 'string' || body.reason.trim().length === 0) {
        return NextResponse.json(
          { error: 'reason must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.reason = body.reason.trim();
    }

    if ('approvedBy' in body) {
      if (typeof body.approvedBy !== 'string' || body.approvedBy.trim().length === 0) {
        return NextResponse.json(
          { error: 'approvedBy must be a non-empty string' },
          { status: 400 }
        );
      }
      const approver = await prisma.user.findUnique({
        where: { id: body.approvedBy.trim() },
        select: { id: true },
      });
      if (!approver) {
        return NextResponse.json({ error: 'Approver user not found' }, { status: 404 });
      }
      updates.approvedBy = body.approvedBy.trim();
    }

    if ('approvalDate' in body) {
      const parsedApprovalDate = new Date(String(body.approvalDate));
      if (Number.isNaN(parsedApprovalDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid approvalDate value' },
          { status: 400 }
        );
      }
      updates.approvalDate = parsedApprovalDate;
    }

    if ('effectiveDate' in body) {
      const parsedEffectiveDate = new Date(String(body.effectiveDate));
      if (Number.isNaN(parsedEffectiveDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid effectiveDate value' },
          { status: 400 }
        );
      }
      updates.effectiveDate = parsedEffectiveDate;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    const updatedAdjustment = await prisma.balanceAdjustment.update({
      where: { id },
      data: updates,
      include: {
        employee: { include: { user: true } },
        leaveType: true,
        approver: true,
      },
    });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: auditUserId,
        employeeId: updatedAdjustment.employeeId,
        adjustmentId: updatedAdjustment.id,
        description: `Updated adjustment ${updatedAdjustment.id}`,
        changes: JSON.stringify({
          before: {
            adjustmentType: existing.adjustmentType,
            adjustmentDays: existing.adjustmentDays,
            reason: existing.reason,
            approvedBy: existing.approvedBy,
            approvalDate: existing.approvalDate,
            effectiveDate: existing.effectiveDate,
          },
          updates,
        }),
      },
    });

    return NextResponse.json(updatedAdjustment, { status: 200 });
  } catch (error) {
    console.error('Error updating adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to update adjustment' },
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

    const adjustment = await prisma.balanceAdjustment.findUnique({
      where: { id },
      include: { leaveType: true },
    });

    if (!adjustment) {
      return NextResponse.json({ error: 'Adjustment not found' }, { status: 404 });
    }

    const relatedAuditCount = await prisma.auditLog.count({
      where: { adjustmentId: id },
    });

    if (relatedAuditCount > 0) {
      return NextResponse.json(
        {
          error: 'Adjustment has audit history and cannot be hard-deleted. Create a compensating adjustment instead.',
        },
        { status: 409 }
      );
    }

    await prisma.balanceAdjustment.delete({
      where: { id },
    });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'DELETE',
        userId: auditUserId,
        employeeId: adjustment.employeeId,
        description: `Deleted adjustment ${adjustment.id}`,
        changes: JSON.stringify({
          adjustmentType: adjustment.adjustmentType,
          adjustmentDays: adjustment.adjustmentDays,
          leaveTypeId: adjustment.leaveTypeId,
        }),
      },
    });

    return NextResponse.json(
      { message: 'Adjustment deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to delete adjustment' },
      { status: 500 }
    );
  }
}
