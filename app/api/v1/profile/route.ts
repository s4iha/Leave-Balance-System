import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateProfileSchema = z.object({
  timeZone: z.string().optional(),
  workHoursPerDay: z.number().min(1).max(24).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employees: {
          include: {
            department: true,
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            leaveBalances: {
              include: {
                leaveType: true,
              },
              where: {
                year: new Date().getFullYear(),
              },
            },
            leaveRequests: {
              include: {
                leaveType: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10, // Limit to recent 10
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employees: true }
    });

    if (!user || user.employees.length === 0) {
      return NextResponse.json({ success: false, error: 'Employee profile not found' }, { status: 404 });
    }

    const employeeId = user.employees[0].id;

    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: validated,
    });

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Error updating profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
