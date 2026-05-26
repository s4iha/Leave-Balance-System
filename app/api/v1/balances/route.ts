import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';
import { AccrualScheme } from '@/lib/prisma';

// GET /api/v1/balances - Fetch employee leave balances
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const leaveTypeId = searchParams.get('leaveTypeId');

    const where: any = { year };
    if (employeeId) where.employeeId = employeeId;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;

    const balances = await prisma.balanceRecord.findMany({
      where,
      include: { employee: { include: { user: true } }, leaveType: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(balances, { status: 200 });
  } catch (error) {
    console.error('Error fetching balances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balances' },
      { status: 500 }
    );
  }
}

// POST /api/v1/balances - Create or update balance record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const {
      employeeId,
      leaveTypeId,
      year,
      scheme,
      openingBalance,
      accrued,
      used,
      adjusted,
      carried,
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

    if (!Number.isInteger(year) || (year as number) < 1970 || (year as number) > 9999) {
      return NextResponse.json(
        { error: 'year must be a valid integer between 1970 and 9999' },
        { status: 400 }
      );
    }
    const parsedYear = year as number;

    if (typeof scheme !== 'string' || !Object.values(AccrualScheme).includes(scheme as AccrualScheme)) {
      return NextResponse.json(
        { error: 'Invalid scheme value' },
        { status: 400 }
      );
    }
    const parsedScheme = scheme as AccrualScheme;

    const numericConstraints: Array<{
      field: string;
      value: unknown;
      allowNegative: boolean;
    }> = [
      { field: 'openingBalance', value: openingBalance, allowNegative: false },
      { field: 'accrued', value: accrued, allowNegative: false },
      { field: 'used', value: used, allowNegative: false },
      { field: 'adjusted', value: adjusted, allowNegative: true },
      { field: 'carried', value: carried, allowNegative: false },
    ];

    for (const { field, value, allowNegative } of numericConstraints) {
      if (value === undefined) {
        continue;
      }
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return NextResponse.json(
          { error: `${field} must be a valid number when provided` },
          { status: 400 }
        );
      }
      if (!allowNegative && value < 0) {
        return NextResponse.json(
          { error: `${field} cannot be negative` },
          { status: 400 }
        );
      }
    }

    const [employee, leaveType] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: employeeId },
        select: { id: true },
      }),
      prisma.leaveType.findUnique({
        where: { id: leaveTypeId },
        select: { id: true, name: true },
      }),
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

    // Check if balance record already exists
    const existing = await prisma.balanceRecord.findUnique({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year: parsedYear } },
    });

    if (existing) {
      // Update existing record
      const nextOpeningBalance = typeof openingBalance === 'number' ? openingBalance : existing.openingBalance;
      const nextAccrued = typeof accrued === 'number' ? accrued : existing.accrued;
      const nextUsed = typeof used === 'number' ? used : existing.used;
      const nextAdjusted = typeof adjusted === 'number' ? adjusted : existing.adjusted;
      const nextCarried = typeof carried === 'number' ? carried : existing.carried;
      const closingBalance = nextOpeningBalance + nextAccrued - nextUsed + nextAdjusted;

      const updated = await prisma.balanceRecord.update({
        where: { id: existing.id },
        data: {
          openingBalance: nextOpeningBalance,
          accrued: nextAccrued,
          used: nextUsed,
          adjusted: nextAdjusted,
          closingBalance,
          carried: nextCarried,
          lastAccrualDate: new Date(),
        },
        include: { employee: { include: { user: true } }, leaveType: true },
      });

      const updateAuditUserId = await getAuditUserId(request);
      await prisma.auditLog.create({
        data: {
          actionType: 'UPDATE',
          userId: updateAuditUserId,
          employeeId,
          description: `Updated balance record ${updated.id} for ${parsedYear}`,
          changes: JSON.stringify({
            before: {
              openingBalance: existing.openingBalance,
              accrued: existing.accrued,
              used: existing.used,
              adjusted: existing.adjusted,
              carried: existing.carried,
              closingBalance: existing.closingBalance,
            },
            after: {
              openingBalance: nextOpeningBalance,
              accrued: nextAccrued,
              used: nextUsed,
              adjusted: nextAdjusted,
              carried: nextCarried,
              closingBalance,
            },
          }),
        },
      });

      return NextResponse.json(updated, { status: 200 });
    }

    // Create new balance record
    const nextOpeningBalance = typeof openingBalance === 'number' ? openingBalance : 0;
    const nextAccrued = typeof accrued === 'number' ? accrued : 0;
    const nextUsed = typeof used === 'number' ? used : 0;
    const nextAdjusted = typeof adjusted === 'number' ? adjusted : 0;
    const nextCarried = typeof carried === 'number' ? carried : 0;
    const closingBalance = nextOpeningBalance + nextAccrued - nextUsed + nextAdjusted;
    const now = new Date();
    
    const balance = await prisma.balanceRecord.create({
      data: {
        employeeId,
        leaveTypeId,
        year: parsedYear,
        scheme: parsedScheme,
        openingBalance: nextOpeningBalance,
        accrued: nextAccrued,
        used: nextUsed,
        adjusted: nextAdjusted,
        closingBalance,
        carried: nextCarried,
        lastAccrualDate: now,
        nextAccrualDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
      include: { employee: { include: { user: true } }, leaveType: true },
    });

    // Create audit log
    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'CREATE',
        userId: auditUserId,
        employeeId,
        description: `Created balance record ${balance.id} for ${parsedYear}`,
        changes: JSON.stringify({
          leaveTypeId,
          leaveTypeName: leaveType.name,
          year: parsedYear,
          openingBalance: nextOpeningBalance,
          accrued: nextAccrued,
          used: nextUsed,
          adjusted: nextAdjusted,
          carried: nextCarried,
          closingBalance,
          scheme: parsedScheme,
        }),
      },
    });

    return NextResponse.json(balance, { status: 201 });
  } catch (error) {
    console.error('Error managing balance:', error);
    return NextResponse.json(
      { error: 'Failed to manage balance' },
      { status: 500 }
    );
  }
}
