import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';
import { Prisma, UserRole } from '@/lib/prisma';

// GET /api/v1/employees - Fetch all employees with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const active = searchParams.get('active');
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '10');

    const where: Prisma.EmployeeWhereInput = {};
    const filters: Prisma.EmployeeWhereInput[] = [];

    if (search) {
      filters.push({
        OR: [
          { user: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
          { user: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } },
          { department: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
          { department: { code: { contains: search, mode: Prisma.QueryMode.insensitive } } },
        ],
      });
    }

    if (department) {
      filters.push({
        department: {
        OR: [
          { name: { contains: department, mode: 'insensitive' } },
          { code: { contains: department, mode: 'insensitive' } },
        ],
      },
      });
    }
    if (active !== null) {
      filters.push({ active: active === 'true' });
    }

    if (filters.length > 0) {
      where.AND = filters;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: { user: true, manager: true, department: true },
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
    const {
      email,
      name,
      departmentId,
      department,
      designation,
      managerId,
      accrualScheme,
      hireDate,
    } = body;

    // Validation
    if (!email || !name || (!department && !departmentId) || !designation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resolvedDepartment = departmentId
      ? await prisma.department.findUnique({ where: { id: departmentId } })
      : department
        ? await prisma.department.findFirst({
          where: {
            OR: [
              { id: department },
              { name: { equals: department, mode: 'insensitive' } },
              { code: { equals: department, mode: 'insensitive' } },
            ],
          },
        })
        : null;

    if (!resolvedDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
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
        departmentId: resolvedDepartment.id,
        designation,
        managerId: managerId || null,
        accrualScheme: accrualScheme || 'MONTHLY',
        hireDate: new Date(hireDate),
        active: true,
      },
      include: { user: true, manager: true },
    });

    // Create audit log
    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'CREATE',
        userId: auditUserId,
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
