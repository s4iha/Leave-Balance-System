import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuditUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        employees: {
          where: { active: true },
          select: { id: true, departmentId: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const employeeId = user.employees?.[0]?.id;
    const currentYear = new Date().getFullYear();
    
    // Always fetch personal balances and personal recent requests if employeeId exists
    let personalStats: any = {};
    if (employeeId) {
      const [personalBalances, personalRecentRequests] = await Promise.all([
        prisma.balanceRecord.findMany({
          where: { employeeId, year: currentYear },
          include: { leaveType: true },
        }),
        prisma.leaveRequest.findMany({
          where: { employeeId },
          include: { leaveType: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      personalStats = {
        leaveBalances: personalBalances.map((balance) => ({
          leaveTypeName: balance.leaveType.name,
          balance: balance.closingBalance,
          total: balance.leaveType.maxDaysPerYear,
        })),
        recentRequests: personalRecentRequests.map((req) => ({
          id: req.id,
          leaveType: req.leaveType.name,
          startDate: req.startDate,
          endDate: req.endDate,
          status: req.status,
          days: Math.ceil(req.durationDays),
        })),
      };
    }

    let stats: any = {};

    if (user.role.name === 'System Admin') {
      // Admin stats
      const [
        totalEmployees,
        totalLeaveTypes,
        pendingRequests,
        approvedThisMonth,
        systemRecentRequests,
      ] = await Promise.all([
        prisma.employee.count({ where: { active: true } }),
        prisma.leaveType.count({ where: { active: true } }),
        prisma.leaveRequest.count({
          where: { status: 'SUBMITTED' },
        }),
        prisma.leaveRequest.count({
          where: {
            status: 'APPROVED',
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        prisma.leaveRequest.findMany({
          where: {},
          include: {
            employee: { include: { user: true } },
            leaveType: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      stats = {
        totalEmployees,
        totalLeaveTypes,
        pendingRequests,
        approvedThisMonth,
        recentRequests: systemRecentRequests.map((req) => ({
          id: req.id,
          employeeName: req.employee.user.name || 'Unknown',
          leaveType: req.leaveType.name,
          startDate: req.startDate,
          endDate: req.endDate,
          status: req.status,
          days: Math.ceil(req.durationDays),
        })),
        ...personalStats, // Add personal balances
      };
    } else if (user.role.name === 'Manager' && employeeId) {
      // Manager stats (team view)
      const managerEmployee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { departmentId: true },
      });

      const teamEmployees = await prisma.employee.findMany({
        where: { 
          departmentId: managerEmployee?.departmentId,
          active: true,
        },
        select: { id: true },
      });
      const teamEmployeeIds = teamEmployees.map((e) => e.id);

      const [
        teamSize,
        pendingRequests,
        approvedThisMonth,
        teamRecentRequests,
      ] = await Promise.all([
        Promise.resolve(teamEmployeeIds.length),
        prisma.leaveRequest.count({
          where: {
            employeeId: { in: teamEmployeeIds },
            status: 'SUBMITTED',
          },
        }),
        prisma.leaveRequest.count({
          where: {
            employeeId: { in: teamEmployeeIds },
            status: 'APPROVED',
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        prisma.leaveRequest.findMany({
          where: {
            employeeId: { in: teamEmployeeIds },
          },
          include: {
            employee: { include: { user: true } },
            leaveType: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      stats = {
        teamSize,
        pendingRequests,
        approvedThisMonth,
        recentRequests: teamRecentRequests.map((req) => ({
          id: req.id,
          employeeName: req.employee.user.name || 'Unknown',
          leaveType: req.leaveType.name,
          startDate: req.startDate,
          endDate: req.endDate,
          status: req.status,
          days: Math.ceil(req.durationDays),
        })),
        ...personalStats, // Add personal balances
      };
    } else if (user.role.name === 'Employee' && employeeId) {
      // Employee stats
      const [
        pendingRequests,
        approvedThisMonth,
      ] = await Promise.all([
        prisma.leaveRequest.count({
          where: {
            employeeId,
            status: 'SUBMITTED',
          },
        }),
        prisma.leaveRequest.count({
          where: {
            employeeId,
            status: 'APPROVED',
            createdAt: {
              gte: new Date(currentYear, new Date().getMonth(), 1),
            },
          },
        }),
      ]);

      stats = {
        pendingRequests,
        approvedThisMonth,
        ...personalStats,
      };
    }

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
