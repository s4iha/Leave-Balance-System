import { prisma } from '@/lib/db';
import { authorize } from '@/lib/auth-utils';
import { getAuditUserId, captureAuditChanges } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            active: true,
            designation: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'DEPARTMENT' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const { name, code, description } = body;

    // Verify department exists
    const existing = await prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if new code conflicts with other departments
    if (code && code !== existing.code) {
      const codeExists = await prisma.department.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Department code already exists' },
          { status: 400 }
        );
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(description !== undefined && { description }),
      },
    });

    // Create audit log
    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: auditUserId,
        description: `Updated department: ${department.name}`,
        changes: JSON.stringify(captureAuditChanges(existing, body, department)),
      },
    });

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update department' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'DEPARTMENT' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = await params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    if (department._count.employees > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete department with active employees. Please reassign or remove employees first.',
        },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id },
    });

    // Create audit log
    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'DELETE',
        userId: auditUserId,
        description: `Deleted department: ${department.name} (${department.code})`,
        changes: JSON.stringify({ before: department }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete department' },
      { status: 500 }
    );
  }
}
