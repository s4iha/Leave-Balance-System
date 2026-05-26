import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth-utils';
import { getAuditUserId, captureAuditChanges } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '50'); // Allow more for dropdowns
    const search = searchParams.get('search') || '';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: Prisma.EmployeeClassificationWhereInput = {
      AND: [
        search ? { name: { contains: search, mode: 'insensitive' } } : {},
        activeOnly ? { active: true } : {},
      ],
    };

    const [classifications, total] = await Promise.all([
      prisma.employeeClassification.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { employees: true },
          },
        },
      }),
      prisma.employeeClassification.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: classifications,
      pagination: {
        total,
        skip,
        take,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('[Classifications API - GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch classifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'CLASSIFICATION' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.employeeClassification.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Classification name already exists' },
        { status: 400 }
      );
    }

    const classification = await prisma.employeeClassification.create({
      data: {
        name,
        description: description || null,
      },
    });

    // Audit Log
    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'CREATE',
        userId: auditUserId,
        description: `Created employee classification: ${name}`,
        changes: JSON.stringify(captureAuditChanges({}, body, classification)),
      },
    });

    return NextResponse.json({
      success: true,
      data: classification,
    });
  } catch (error) {
    console.error('[Classifications API - POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create classification' },
      { status: 500 }
    );
  }
}
