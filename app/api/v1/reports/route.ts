import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isSystemAdmin = auth.role === 'System Admin';
    const isManager = auth.role === 'Manager';
    if (!isSystemAdmin && !isManager) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'balance';
    const department = searchParams.get('department');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const parsedYear = Number.parseInt(year, 10);

    if (Number.isNaN(parsedYear)) {
      return NextResponse.json({ success: false, error: 'Invalid year filter' }, { status: 400 });
    }

    let managerDepartmentId: string | null = null;
    if (isManager) {
      const managerEmployee = await prisma.employee.findUnique({
        where: { userId: auth.userId },
        select: { departmentId: true },
      });
      if (!managerEmployee?.departmentId) {
        return NextResponse.json({ success: false, error: 'Manager department not found' }, { status: 403 });
      }
      managerDepartmentId = managerEmployee.departmentId;
    }

    const departmentFilter = department && department !== 'ALL'
      ? {
          department: {
            OR: [
              { name: { contains: department, mode: 'insensitive' as const } },
              { code: { contains: department, mode: 'insensitive' as const } },
            ],
          },
        }
      : undefined;

    const managerDepartmentFilter = managerDepartmentId
      ? {
          departmentId: managerDepartmentId,
        }
      : undefined;

    if (reportType === 'balance') {
      const balances = await prisma.balanceRecord.findMany({
        where: {
          year: parsedYear,
          employee: {
            ...(managerDepartmentFilter ?? {}),
            ...(departmentFilter ?? {}),
          },
        },
        include: {
          employee: {
            include: { user: true },
          },
          leaveType: true,
        },
        orderBy: [
          { employee: { user: { name: 'asc' } } },
          { leaveType: { name: 'asc' } },
        ],
      });

      return NextResponse.json({
        success: true,
        data: balances,
        reportType: 'balance',
        filters: { department, year },
      });
    }

    if (reportType === 'accrual') {
      const employees = await prisma.employee.findMany({
        where: {
          ...(managerDepartmentFilter ?? {}),
          ...(departmentFilter ?? {}),
        },
        include: {
          user: true,
          leaveBalances: {
            where: { year: parsedYear },
            include: { leaveType: true },
          },
        },
      });

      type AccrualSummary = Record<
        string,
        { count: number; totalBalance: number; employees: { id: string; name: string | null; email: string | null }[] }
      >;

      const accrualSummary = employees.reduce<AccrualSummary>((acc, employee) => {
        const scheme = employee.accrualScheme;
        if (!acc[scheme]) {
          acc[scheme] = { count: 0, totalBalance: 0, employees: [] };
        }
        acc[scheme].count += 1;
        acc[scheme].totalBalance += employee.leaveBalances.reduce((sum, record) => sum + record.closingBalance, 0);
        acc[scheme].employees.push({
          id: employee.id,
          name: employee.user?.name ?? null,
          email: employee.user?.email ?? null,
        });
        return acc;
      }, {});

      return NextResponse.json({
        success: true,
        data: accrualSummary,
        reportType: 'accrual',
        filters: { department, year },
      });
    }

    if (reportType === 'leave-type') {
      const requests = await prisma.leaveRequest.findMany({
        where: {
          startDate: {
            gte: new Date(`${parsedYear}-01-01T00:00:00.000Z`),
            lte: new Date(`${parsedYear}-12-31T23:59:59.999Z`),
          },
          status: 'APPROVED',
          employee: {
            ...(managerDepartmentFilter ?? {}),
            ...(departmentFilter ?? {}),
          },
        },
        include: {
          leaveType: true,
        },
      });

      type LeaveTypeDistribution = Record<string, { count: number; totalDays: number }>;
      const distribution = requests.reduce<LeaveTypeDistribution>((acc, requestRecord) => {
        const typeName = requestRecord.leaveType?.name || 'Unknown';
        if (!acc[typeName]) {
          acc[typeName] = { count: 0, totalDays: 0 };
        }
        acc[typeName].count += 1;
        acc[typeName].totalDays += requestRecord.durationDays || 0;
        return acc;
      }, {});

      return NextResponse.json({
        success: true,
        data: distribution,
        reportType: 'leave-type',
        filters: { department, year },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('[Reports API] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
