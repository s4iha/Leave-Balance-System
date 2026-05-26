import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authorize } from '@/lib/auth-utils';
import { getAuditUserId, captureAuditChanges } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'CLASSIFICATION' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const { name, description, active } = body;

    const existing = await prisma.employeeClassification.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Classification not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.employeeClassification.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        description: description !== undefined ? description : existing.description,
        active: active !== undefined ? active : existing.active,
      },
    });

    // Audit Log
    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: auditUserId,
        description: `Updated employee classification: ${updated.name}`,
        changes: JSON.stringify(captureAuditChanges(existing, body, updated)),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[Classifications API - PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update classification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'CLASSIFICATION' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = await params;

    const existing = await prisma.employeeClassification.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Classification not found' },
        { status: 404 }
      );
    }

    if (existing._count.employees > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete classification: It is assigned to one or more employees.' },
        { status: 400 }
      );
    }

    await prisma.employeeClassification.delete({
      where: { id },
    });

    // Audit Log
    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'DELETE',
        userId: auditUserId,
        description: `Deleted employee classification: ${existing.name}`,
        changes: JSON.stringify({ before: existing }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Classification deleted successfully',
    });
  } catch (error) {
    console.error('[Classifications API - DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete classification' },
      { status: 500 }
    );
  }
}
