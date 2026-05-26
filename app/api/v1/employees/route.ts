import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId, captureAuditChanges } from '@/lib/audit';
import type { Prisma } from '@/lib/prisma';
import { authorize, getAuthContext } from '@/lib/auth-utils';
import { buildOnboardingEmail, sendEmail } from '@/lib/email';

// GET /api/v1/employees - Fetch all employees with filters
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const active = searchParams.get('active');
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '10');

    const where: Prisma.EmployeeWhereInput = {};
    const filters: Prisma.EmployeeWhereInput[] = [];

    // RBAC Visibility Filtering
    const isSuperuser = auth.role === 'System Admin';
    const canManageUsers = auth.permissions.some(p => p.action === 'MANAGE' && p.resource === 'USER');

    if (!isSuperuser && !canManageUsers) {
      if (auth.role === 'Manager') {
        filters.push({
          OR: [
            { managerId: auth.userId },
            { userId: auth.userId }
          ]
        });
      } else {
        // Employees only see themselves
        filters.push({ userId: auth.userId });
      }
    }

    if (search) {
      filters.push({
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { department: { name: { contains: search, mode: 'insensitive' } } },
          { department: { code: { contains: search, mode: 'insensitive' } } },
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
        include: { user: true, manager: true, department: true, classification: true },
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
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'USER' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

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
      classificationId,
      employeeNumber,
      workHoursPerDay,
      gender,
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

    // Generate default password
    const { generateDefaultPassword, hashPassword } = await import('@/lib/password-utils');
    const defaultPassword = generateDefaultPassword(name);
    const hashedPassword = await hashPassword(defaultPassword);

    // Create user first
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: {
          connect: { name: 'Employee' },
        },
        password: hashedPassword,
        requiresPasswordChange: true,
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
        classificationId: classificationId || null,
        accrualScheme: accrualScheme || 'MONTHLY',
        hireDate: new Date(hireDate),
        gender: gender || null,
        employeeNumber: employeeNumber || null,
        workHoursPerDay: workHoursPerDay || 8,
        active: true,
      },
      include: { user: true, manager: true, classification: true },
    });


    // Create audit log
    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'CREATE',
        userId: auditUserId,
        employeeId: employee.id,
        description: `Created employee: ${name}`,
        changes: JSON.stringify(captureAuditChanges({}, body, employee)),
      },
    });

    // Send credentials email (Non-blocking)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const onboardingEmail = buildOnboardingEmail({
      name,
      email,
      temporaryPassword: defaultPassword,
      appUrl,
    });
    sendEmail({
      to: email,
      ...onboardingEmail,
    }).then(async (result) => {
      // Async audit log for email status
      await prisma.auditLog.create({
        data: {
          actionType: 'UPDATE',
          userId: auditUserId,
          employeeId: employee.id,
          description: result.success
            ? `Onboarding email sent successfully to ${email}`
            : `Failed to send onboarding email to ${email}: ${result.error}`,
        },
      });
    }).catch(err => console.error('[Onboarding Email] Unexpected Error:', err));

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
