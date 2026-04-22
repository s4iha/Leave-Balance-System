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
    let stats: any = {};

    if (user.role === 'ADMIN') {
      // Admin stats
      const [
        totalEmployees,
        totalLeaveTypes,
        pendingRequests,
        approvedThisMonth,
        recentRequests,
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
        recentRequests: recentRequests.map((req) => ({
          id: req.id,
          employeeName: req.employee.user.name || 'Unknown',
          leaveType: req.leaveType.name,
          startDate: req.startDate,
          endDate: req.endDate,
          status: req.status,
          days: Math.ceil(req.durationDays),
        })),
      };
    } else if (user.role === 'MANAGER' && employeeId) {
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
        recentRequests,
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
        recentRequests: recentRequests.map((req) => ({
          id: req.id,
          employeeName: req.employee.user.name || 'Unknown',
          leaveType: req.leaveType.name,
          startDate: req.startDate,
          endDate: req.endDate,
          status: req.status,
          days: Math.ceil(req.durationDays),
        })),
      };
    } else if (user.role === 'EMPLOYEE' && employeeId) {
      // Employee stats
      const currentYear = new Date().getFullYear();
      const [
        pendingRequests,
        approvedThisMonth,
        leaveBalances,
        recentRequests,
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
        prisma.balanceRecord.findMany({
          where: { employeeId, year: currentYear },
          include: { leaveType: true },
        }),
        prisma.leaveRequest.findMany({
          where: {
            employeeId,
          },
          include: {
            leaveType: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      stats = {
        pendingRequests,
        approvedThisMonth,
        leaveBalances: leaveBalances.map((balance) => ({
          leaveTypeName: balance.leaveType.name,
          balance: balance.closingBalance,
          total: balance.leaveType.maxDaysPerYear,
        })),
        recentRequests: recentRequests.map((req) => ({
          id: req.id,
          leaveType: req.leaveType.name,
          startDate: req.startDate,
          endDate: req.endDate,
          status: req.status,
          days: Math.ceil(req.durationDays),
        })),
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
