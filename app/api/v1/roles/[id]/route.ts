import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authorize } from '@/lib/auth-utils';
import { getAuditUserId } from '@/lib/audit';
import { z } from 'zod';

const updateRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  permissions: z.array(z.string()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'ROLE' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    if (!existingRole) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    const { name, description, color, permissions } = parsed.data;
    if (name && name.toLowerCase() !== existingRole.name.toLowerCase()) {
      const duplicateRole = await prisma.role.findFirst({
        where: {
          id: { not: id },
          name: { equals: name, mode: 'insensitive' },
        },
      });
      if (duplicateRole) {
        return NextResponse.json({ success: false, error: 'Role name already exists' }, { status: 400 });
      }
    }

    const updatedRole = await prisma.$transaction(async (tx) => {
      if (permissions) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: permissions.map((permissionId) => ({ roleId: id, permissionId })),
          });
        }
      }

      return tx.role.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(color !== undefined ? { color } : {}),
        },
        include: {
          permissions: {
            include: { permission: true },
          },
          _count: { select: { users: true } },
        },
      });
    });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: auditUserId,
        description: `Updated role: ${existingRole.name}`,
        changes: JSON.stringify({
          before: {
            name: existingRole.name,
            description: existingRole.description,
            color: existingRole.color,
            permissions: existingRole.permissions.map((rp) => `${rp.permission.action}:${rp.permission.resource}`),
          },
          after: {
            name: updatedRole.name,
            description: updatedRole.description,
            color: updatedRole.color,
            permissions: updatedRole.permissions.map((rp) => `${rp.permission.action}:${rp.permission.resource}`),
          },
        }),
      },
    });

    return NextResponse.json({ success: true, data: updatedRole });
  } catch (error) {
    console.error('[Roles API - PATCH by id] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'ROLE' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = await params;
    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!existingRole) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.isSystem) {
      return NextResponse.json({ success: false, error: 'System roles cannot be deleted' }, { status: 400 });
    }

    if (existingRole._count.users > 0) {
      return NextResponse.json(
        { success: false, error: 'Role has active users and cannot be deleted' },
        { status: 400 }
      );
    }

    await prisma.role.delete({ where: { id } });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'DELETE',
        userId: auditUserId,
        description: `Deleted role: ${existingRole.name}`,
        changes: JSON.stringify({
          before: {
            id: existingRole.id,
            name: existingRole.name,
            description: existingRole.description,
            color: existingRole.color,
          },
          after: null,
        }),
      },
    });

    return NextResponse.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('[Roles API - DELETE by id] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete role' }, { status: 500 });
  }
}
