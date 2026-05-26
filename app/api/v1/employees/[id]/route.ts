import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId, captureAuditChanges } from '@/lib/audit';

// GET /api/v1/employees/[id] - Fetch employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true, manager: true, classification: true, leaveBalances: { include: { leaveType: true } } },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      email,
      departmentId,
      department,
      designation,
      managerId,
      accrualScheme,
      active,
      classificationId,
      employeeNumber,
      workHoursPerDay,
      gender,
    } = body;

    // Get existing employee
    const existing = await prisma.employee.findUnique({
      where: { id },
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

    let resolvedDepartmentId: string | undefined;
    if (departmentId || department) {
      const resolvedDepartment = departmentId
        ? await prisma.department.findUnique({ where: { id: departmentId } })
        : await prisma.department.findFirst({
          where: {
            OR: [
              { id: department },
              { name: { equals: department, mode: 'insensitive' } },
              { code: { equals: department, mode: 'insensitive' } },
            ],
          },
        });

      if (!resolvedDepartment) {
        return NextResponse.json(
          { error: 'Department not found' },
          { status: 400 }
        );
      }
      resolvedDepartmentId = resolvedDepartment.id;
    }

    // Update employee data
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(resolvedDepartmentId && { departmentId: resolvedDepartmentId }),
        ...(designation && { designation }),
        ...(managerId && { managerId }),
        ...(classificationId !== undefined && { classificationId }),
        ...(accrualScheme && { accrualScheme }),
        ...(employeeNumber !== undefined && { employeeNumber }),
        ...(workHoursPerDay !== undefined && { workHoursPerDay }),
        ...(gender !== undefined && { gender }),
        ...(active !== undefined && { active }),
      },
      include: { user: true, manager: true, classification: true },
    });

    // Create audit log
    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: auditUserId,
        employeeId: id,
        description: `Updated employee: ${employee.user.name}`,
        changes: JSON.stringify(captureAuditChanges(existing, body, employee)),
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

// DELETE /api/v1/employees/[id] - Delete employee (soft delete with cascading check)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const forceDelete = searchParams.get('force') === 'true';

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check for active requests
    const activeRequests = await prisma.leaveRequest.count({
      where: {
        employeeId: id,
        status: { in: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
      },
    });

    // Check for balance records
    const balanceRecords = await prisma.balanceRecord.count({
      where: { employeeId: id },
    });

    // Check for pending adjustments
    const pendingAdjustments = await prisma.balanceAdjustment.count({
      where: { employeeId: id },
    });

    // If there are references and forceDelete is not set, return conflict
    if ((activeRequests > 0 || balanceRecords > 0 || pendingAdjustments > 0) && !forceDelete) {
      return NextResponse.json(
        {
          error: 'Cannot delete employee with active records',
          activeRequests,
          balanceRecords,
          pendingAdjustments,
          message: `This employee has ${activeRequests} active request(s), ${balanceRecords} balance record(s), and ${pendingAdjustments} adjustment(s). Use force=true to delete anyway.`,
        },
        { status: 409 }
      );
    }

    // Soft delete by marking as inactive
    await prisma.employee.update({
      where: { id },
      data: { active: false },
    });

    // Create audit log with cascading information
    const deleteAuditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'DELETE',
        userId: deleteAuditUserId,
        employeeId: id,
        description: `Deleted employee: ${employee.user.name} (force=${forceDelete}, activeRequests=${activeRequests}, balanceRecords=${balanceRecords}, adjustments=${pendingAdjustments})`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Employee deleted successfully',
        data: {
          id: employee.id,
          name: employee.user.name,
          activeRequests,
          balanceRecords,
          pendingAdjustments,
        },
      },
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
