import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/v1/employees/[id] - Fetch employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { user: true, manager: true, leaveBalances: { include: { leaveType: true } } },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(employee, { status: 200 });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/employees/[id] - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, email, department, designation, managerId, accrualScheme, active } = body;

    // Get existing employee
    const existing = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Update user data
    if (name || email) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
        },
      });
    }

    // Update employee data
    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        ...(department && { department }),
        ...(designation && { designation }),
        ...(managerId && { managerId }),
        ...(accrualScheme && { accrualScheme }),
        ...(active !== undefined && { active }),
      },
      include: { user: true, manager: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: request.headers.get('x-user-id') || 'system',
        employeeId: params.id,
        description: `Updated employee: ${employee.user.name}`,
        changes: JSON.stringify(body),
      },
    });

    return NextResponse.json(employee, { status: 200 });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/employees/[id] - Delete employee (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Soft delete by marking as inactive
    await prisma.employee.update({
      where: { id: params.id },
      data: { active: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actionType: 'DELETE',
        userId: request.headers.get('x-user-id') || 'system',
        employeeId: params.id,
        description: `Deleted employee: ${employee.user.name}`,
      },
    });

    return NextResponse.json(
      { message: 'Employee deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
