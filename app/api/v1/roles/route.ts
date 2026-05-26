import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';
import { authorize } from '@/lib/auth-utils';
import { z } from 'zod';

const roleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  permissions: z.array(z.string()).optional(), // array of permission IDs
});

export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'ROLE' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error('[Roles API - GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'ROLE' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await request.json();
    const result = roleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      );
    }

    const { name, description, color, permissions } = result.data;

    // Check if role name already exists
    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Role name already exists' }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        color,
        permissions: permissions && permissions.length > 0 ? {
          create: permissions.map(id => ({ permissionId: id }))
        } : undefined
      },
      include: {
        permissions: {
          include: { permission: true }
        },
        _count: { select: { users: true } },
      }
    });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'CREATE',
        userId: auditUserId,
        description: `Created role: ${role.name}`,
        changes: JSON.stringify({
          before: null,
          after: {
            id: role.id,
            name: role.name,
            description: role.description,
            color: role.color,
            permissions: role.permissions.map((rp) => `${rp.permission.action}:${rp.permission.resource}`),
          },
        }),
      },
    });

    return NextResponse.json({ success: true, data: role }, { status: 201 });
  } catch (error) {
    console.error('[Roles API - POST] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create role' }, { status: 500 });
  }
}
