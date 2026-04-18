import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';

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
    const body = await request.json();
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

    // Validation
    if (!employeeId || !leaveTypeId || !year || !scheme) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if balance record already exists
    const existing = await prisma.balanceRecord.findUnique({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
    });

    if (existing) {
      // Update existing record
      const closingBalance = (openingBalance || 0) + (accrued || 0) - (used || 0) + (adjusted || 0);
      const updated = await prisma.balanceRecord.update({
        where: { id: existing.id },
        data: {
          openingBalance: openingBalance || existing.openingBalance,
          accrued: accrued !== undefined ? accrued : existing.accrued,
          used: used !== undefined ? used : existing.used,
          adjusted: adjusted !== undefined ? adjusted : existing.adjusted,
          closingBalance,
          carried: carried || existing.carried,
          lastAccrualDate: new Date(),
        },
        include: { employee: { include: { user: true } }, leaveType: true },
      });

      return NextResponse.json(updated, { status: 200 });
    }

    // Create new balance record
    const closingBalance = (openingBalance || 0) + (accrued || 0) - (used || 0) + (adjusted || 0);
    const now = new Date();
    
    const balance = await prisma.balanceRecord.create({
      data: {
        employeeId,
        leaveTypeId,
        year,
        scheme,
        openingBalance: openingBalance || 0,
        accrued: accrued || 0,
        used: used || 0,
        adjusted: adjusted || 0,
        closingBalance,
        carried: carried || 0,
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
        description: `Created balance record for ${year}`,
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
