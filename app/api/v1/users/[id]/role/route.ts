import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';

// Validate if current user is ADMIN (in real app, verify JWT token)
function isAdmin(request: NextRequest): boolean {
  // TODO: Implement proper JWT verification
  // For now, we'll rely on frontend authorization
  return true;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only admins can change user roles.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { newRole, reason } = body;

    // Validate input
    if (!newRole) {
      return NextResponse.json(
        { success: false, error: 'New role is required' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(newRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Fetch the user to be updated
    const userToUpdate = await prisma.user.findUnique({
      where: { id },
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

    // Prevent removing last admin
    if (userToUpdate.role === 'ADMIN' && newRole !== 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Cannot remove the last admin user' },
          { status: 400 }
        );
      }
    }

    const oldRole = userToUpdate.role;

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: newRole },
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
        description: `User role changed from ${oldRole} to ${newRole}`,
        changes: JSON.stringify({
          targetUserId: id,
          oldRole,
          newRole,
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
