import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';

// GET /api/v1/leave-types - Fetch all leave types
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get('active');
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '10');

    const where: any = {};
    if (active !== null) where.active = active === 'true';

    const [leaveTypes, total] = await Promise.all([
      prisma.leaveType.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leaveType.count({ where }),
    ]);

    return NextResponse.json(
      { leaveTypes, total, page: Math.floor(skip / take) + 1, pageSize: take },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching leave types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave types' },
      { status: 500 }
    );
  }
}

// POST /api/v1/leave-types - Create new leave type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      maxDaysPerYear,
      requiresApproval,
      carryoverAllowed,
      carryoverMaxDays,
      carryoverExpiryDays,
    } = body;

    // Validation
    if (!name || maxDaysPerYear === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, maxDaysPerYear' },
        { status: 400 }
      );
    }

    // Check if leave type already exists
    const existing = await prisma.leaveType.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: 'Leave type already exists' },
        { status: 409 }
      );
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        name,
        description: description || null,
        maxDaysPerYear,
        requiresApproval: requiresApproval ?? true,
        carryoverAllowed: carryoverAllowed ?? false,
        carryoverMaxDays: carryoverMaxDays || null,
        carryoverExpiryDays: carryoverExpiryDays || null,
        active: true,
      },
    });

    // Create audit log
    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'CREATE',
        userId: auditUserId,
        description: `Created leave type: ${name}`,
      },
    });

    return NextResponse.json(leaveType, { status: 201 });
  } catch (error) {
    console.error('Error creating leave type:', error);
    return NextResponse.json(
      { error: 'Failed to create leave type' },
      { status: 500 }
    );
  }
}
