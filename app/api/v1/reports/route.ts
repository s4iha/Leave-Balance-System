import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'balance';
    const department = searchParams.get('department');
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    if (reportType === 'balance') {
      // Leave balance report by employee
      const balances = await prisma.balanceRecord.findMany({
        where: {
          year: parseInt(year),
          ...(department && {
            employee: {
              department: department
            }
          })
        },
        include: {
          employee: {
            include: { user: true }
          },
          leaveType: true
        },
        orderBy: [
          { employee: { user: { name: 'asc' } } },
          { leaveType: { name: 'asc' } }
        ]
      });

      return NextResponse.json({
        success: true,
        data: balances,
        reportType: 'balance',
        filters: { department, year }
      });

    } else if (reportType === 'accrual') {
      // Accrual scheme analysis
      const employees = await prisma.employee.findMany({
        include: {
          user: true,
          balances: {
            where: { year: parseInt(year) },
            include: { leaveType: true }
          }
        },
        ...(department && { where: { department } })
      });

      const accrualSummary = employees.reduce((acc, emp) => {
        const scheme = emp.accrualScheme;
        if (!acc[scheme]) {
          acc[scheme] = { count: 0, totalBalance: 0, employees: [] };
        }
        acc[scheme].count += 1;
        acc[scheme].totalBalance += emp.balances.reduce((sum, b) => sum + b.closingBalance, 0);
        acc[scheme].employees.push({
          id: emp.id,
          name: emp.user?.name,
          email: emp.user?.email
        });
        return acc;
      }, {} as Record<string, any>);

      return NextResponse.json({
        success: true,
        data: accrualSummary,
        reportType: 'accrual',
        filters: { department, year }
      });

    } else if (reportType === 'leave-type') {
      // Leave type distribution
      const requests = await prisma.leaveRequest.findMany({
        where: {
          startDate: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31`)
          },
          status: 'APPROVED'
        },
        include: { leaveType: true }
      });

      const distribution = requests.reduce((acc, req) => {
        const typeName = req.leaveType?.name || 'Unknown';
        if (!acc[typeName]) {
          acc[typeName] = { count: 0, totalDays: 0 };
        }
        acc[typeName].count += 1;
        acc[typeName].totalDays += req.durationDays || 0;
        return acc;
      }, {} as Record<string, any>);

      return NextResponse.json({
        success: true,
        data: distribution,
        reportType: 'leave-type',
        filters: { year }
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid report type' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('[Reports API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
