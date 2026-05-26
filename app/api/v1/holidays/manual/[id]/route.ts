import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';
import { authorize } from '@/lib/auth-utils';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  date: z.string().datetime().optional(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'HOLIDAY' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      );
    }

    const { name, date, notes } = result.data;

    const existing = await prisma.manualHoliday.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Manual holiday not found' }, { status: 404 });
    }

    const updateData: any = { name, notes };
    if (date) {
      const parsedDate = new Date(date);
      updateData.date = parsedDate;
      updateData.year = parsedDate.getFullYear();
    }

    const manual = await prisma.manualHoliday.update({
      where: { id },
      data: updateData,
    });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: auditUserId,
        description: `Updated manual holiday: ${manual.name}`,
        changes: JSON.stringify({
          before: existing,
          after: manual,
        }),
      },
    });

    return NextResponse.json({ success: true, data: manual });
  } catch (error) {
    console.error('[ManualHolidays API - PATCH] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update manual holiday' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'HOLIDAY' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = await params;

    const existing = await prisma.manualHoliday.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Manual holiday not found' }, { status: 404 });
    }

    await prisma.manualHoliday.delete({ where: { id } });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'DELETE',
        userId: auditUserId,
        description: `Deleted manual holiday: ${existing.name}`,
        changes: JSON.stringify({
          before: existing,
          after: null,
        }),
      },
    });

    return NextResponse.json({ success: true, message: 'Manual holiday deleted successfully' });
  } catch (error) {
    console.error('[ManualHolidays API - DELETE] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete manual holiday' }, { status: 500 });
  }
}
