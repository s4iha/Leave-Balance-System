import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';
import { AccrualScheme } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const balance = await prisma.balanceRecord.findUnique({
      where: { id },
      include: {
        employee: { include: { user: true } },
        leaveType: true,
      },
    });

    if (!balance) {
      return NextResponse.json({ error: 'Balance record not found' }, { status: 404 });
    }

    return NextResponse.json(balance, { status: 200 });
  } catch (error) {
    console.error('Error fetching balance record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance record' },
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

    const existing = await prisma.balanceRecord.findUnique({
      where: { id },
      include: { employee: { include: { user: true } }, leaveType: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Balance record not found' }, { status: 404 });
    }

    const updates: {
      openingBalance?: number;
      accrued?: number;
      used?: number;
      adjusted?: number;
      carried?: number;
      year?: number;
      scheme?: AccrualScheme;
      lastAccrualDate?: Date;
      nextAccrualDate?: Date;
    } = {};

    const numericFields = ['openingBalance', 'accrued', 'used', 'adjusted', 'carried'] as const;
    for (const field of numericFields) {
      if (field in body) {
        const value = body[field];
        if (typeof value !== 'number' || Number.isNaN(value)) {
          return NextResponse.json(
            { error: `${field} must be a valid number` },
            { status: 400 }
          );
        }
        if (field !== 'adjusted' && value < 0) {
          return NextResponse.json(
            { error: `${field} cannot be negative` },
            { status: 400 }
          );
        }
        updates[field] = value;
      }
    }

    if ('year' in body) {
      if (!Number.isInteger(body.year) || (body.year as number) < 1970) {
        return NextResponse.json(
          { error: 'year must be a valid integer year' },
          { status: 400 }
        );
      }
      updates.year = body.year as number;
    }

    if ('scheme' in body) {
      if (typeof body.scheme !== 'string' || !Object.values(AccrualScheme).includes(body.scheme as AccrualScheme)) {
        return NextResponse.json(
          { error: 'Invalid scheme value' },
          { status: 400 }
        );
      }
      updates.scheme = body.scheme as AccrualScheme;
    }

    if ('lastAccrualDate' in body) {
      const parsedLastAccrualDate = new Date(String(body.lastAccrualDate));
      if (Number.isNaN(parsedLastAccrualDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid lastAccrualDate value' },
          { status: 400 }
        );
      }
      updates.lastAccrualDate = parsedLastAccrualDate;
    }

    if ('nextAccrualDate' in body) {
      const parsedNextAccrualDate = new Date(String(body.nextAccrualDate));
      if (Number.isNaN(parsedNextAccrualDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid nextAccrualDate value' },
          { status: 400 }
        );
      }
      updates.nextAccrualDate = parsedNextAccrualDate;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    const nextLastAccrualDate = updates.lastAccrualDate ?? existing.lastAccrualDate;
    const nextNextAccrualDate = updates.nextAccrualDate ?? existing.nextAccrualDate;
    if (nextNextAccrualDate < nextLastAccrualDate) {
      return NextResponse.json(
        { error: 'nextAccrualDate cannot be earlier than lastAccrualDate' },
        { status: 400 }
      );
    }

    if (updates.year !== undefined && updates.year !== existing.year) {
      const conflict = await prisma.balanceRecord.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: existing.employeeId,
            leaveTypeId: existing.leaveTypeId,
            year: updates.year,
          },
        },
        select: { id: true },
      });

      if (conflict) {
        return NextResponse.json(
          {
            error: `Balance record already exists for employee ${existing.employeeId}, leave type ${existing.leaveTypeId}, year ${updates.year}`,
          },
          { status: 409 }
        );
      }
    }

    const openingBalance = updates.openingBalance ?? existing.openingBalance;
    const accrued = updates.accrued ?? existing.accrued;
    const used = updates.used ?? existing.used;
    const adjusted = updates.adjusted ?? existing.adjusted;
    const closingBalance = openingBalance + accrued - used + adjusted;

    const updatedBalance = await prisma.balanceRecord.update({
      where: { id },
      data: {
        ...updates,
        closingBalance,
      },
      include: {
        employee: { include: { user: true } },
        leaveType: true,
      },
    });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: auditUserId,
        employeeId: updatedBalance.employeeId,
        description: `Updated balance record ${updatedBalance.id}`,
        changes: JSON.stringify({
          before: {
            openingBalance: existing.openingBalance,
            accrued: existing.accrued,
            used: existing.used,
            adjusted: existing.adjusted,
            carried: existing.carried,
            closingBalance: existing.closingBalance,
            year: existing.year,
            scheme: existing.scheme,
          },
          updates: {
            ...updates,
            closingBalance,
          },
        }),
      },
    });

    return NextResponse.json(updatedBalance, { status: 200 });
  } catch (error) {
    console.error('Error updating balance record:', error);
    return NextResponse.json(
      { error: 'Failed to update balance record' },
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
    const balance = await prisma.balanceRecord.findUnique({
      where: { id },
      include: {
        _count: { select: { leaveRequests: true } },
      },
    });

    if (!balance) {
      return NextResponse.json({ error: 'Balance record not found' }, { status: 404 });
    }

    if (balance._count.leaveRequests > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete balance record linked to leave requests. Keep the record for audit consistency.',
        },
        { status: 409 }
      );
    }

    await prisma.balanceRecord.delete({
      where: { id },
    });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'DELETE',
        userId: auditUserId,
        employeeId: balance.employeeId,
        description: `Deleted balance record ${balance.id}`,
        changes: JSON.stringify({
          leaveTypeId: balance.leaveTypeId,
          year: balance.year,
        }),
      },
    });

    return NextResponse.json(
      { message: 'Balance record deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting balance record:', error);
    return NextResponse.json(
      { error: 'Failed to delete balance record' },
      { status: 500 }
    );
  }
}
