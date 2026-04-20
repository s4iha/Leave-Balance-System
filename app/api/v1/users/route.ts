import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';
import { UserRole } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build filters
    const where: any = {};
    if (role) where.role = role;
    if (status) where.employees = { some: { active: status === 'active' } };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          employees: {
            select: {
              id: true,
              active: true,
              designation: true,
              department: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const formattedUsers = users.map((user: (typeof users)[number]) => {
      const { employees, ...rest } = user;
      return {
        ...rest,
        employee: employees[0] ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = body.name;
    const email = body.email;
    const role = body.role;
    const active = body.active;

    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'email is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'email must be a valid email address' },
        { status: 400 }
      );
    }

    if (active !== undefined && typeof active !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'active must be a boolean when provided' },
        { status: 400 }
      );
    }

    const resolvedRole = typeof role === 'string' ? role.trim().toUpperCase() : UserRole.EMPLOYEE;

    if (!Object.values(UserRole).includes(resolvedRole as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Expected ADMIN, MANAGER, or EMPLOYEE' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        role: resolvedRole as UserRole,
        active: typeof active === 'boolean' ? active : true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'CREATE',
        userId: auditUserId,
        description: `Created user: ${user.email}`,
        changes: JSON.stringify({
          id: user.id,
          email: user.email,
          role: user.role,
          active: user.active,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
