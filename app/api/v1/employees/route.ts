import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

// GET /api/v1/employees - Fetch all employees with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const department = searchParams.get('department');
    const active = searchParams.get('active');
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '10');

    const where: any = {};
    if (department) where.department = { contains: department };
    if (active !== null) where.active = active === 'true';

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: { user: true, manager: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json(
      { employees, total, page: Math.floor(skip / take) + 1, pageSize: take },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST /api/v1/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, department, designation, managerId, accrualScheme, hireDate } = body;

    // Validation
    if (!email || !name || !department || !designation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create user first
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: UserRole.EMPLOYEE,
        active: true,
      },
    });

    // Create employee profile
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        department,
        designation,
        managerId: managerId || null,
        accrualScheme: accrualScheme || 'MONTHLY',
        hireDate: new Date(hireDate),
        active: true,
      },
      include: { user: true, manager: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actionType: 'CREATE',
        userId: request.headers.get('x-user-id') || 'system',
        employeeId: employee.id,
        description: `Created employee: ${name}`,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
