import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';

import { authorize } from '@/lib/auth-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'USER' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = await params;

    const body = await request.json();
    const { roleId, reason } = body;

    // Validate input
    if (!roleId) {
      return NextResponse.json(
        { success: false, error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Check if role exists
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Fetch the user to be updated
    const userToUpdate = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!userToUpdate) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const auditUserId = await getAuditUserId(request);

    // Prevent changing own role
    if (id === auditUserId) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Prevent removing last system admin
    if (userToUpdate.role.name === 'System Admin' && role.name !== 'System Admin') {
      const adminRole = await prisma.role.findUnique({ where: { name: 'System Admin' } });
      if (adminRole) {
        const adminCount = await prisma.user.count({
          where: { roleId: adminRole.id },
        });
        if (adminCount <= 1) {
          return NextResponse.json(
            { success: false, error: 'Cannot remove the last admin user' },
            { status: 400 }
          );
        }
      }
    }

    const oldRoleName = userToUpdate.role.name;

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { roleId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employees: {
          select: {
            id: true,
            active: true,
          },
        },
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        description: `User role changed from ${oldRoleName} to ${role.name}`,
        changes: JSON.stringify({
          targetUserId: id,
          oldRole: oldRoleName,
          newRole: role.name,
          reason,
        }),
        userId: auditUserId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User role updated successfully',
        data: (() => {
          const { employees, ...rest } = updatedUser;
          return { ...rest, employee: employees[0] ?? null };
        })(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}
