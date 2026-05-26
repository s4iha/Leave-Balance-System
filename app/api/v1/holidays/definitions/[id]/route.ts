import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';
import { authorize } from '@/lib/auth-utils';
import { z } from 'zod';
import { RuleType, OffsetRule } from '@/lib/prisma';

const updateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  ruleType: z.nativeEnum(RuleType).optional(),
  month: z.number().min(1).max(12).optional().nullable(),
  day: z.number().min(1).max(31).optional().nullable(),
  weekday: z.number().min(0).max(6).optional().nullable(),
  nth: z.number().optional().nullable(),
  offsetRule: z.nativeEnum(OffsetRule).optional(),
  isActive: z.boolean().optional(),
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

    const data = result.data;

    const existing = await prisma.holidayDefinition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Holiday rule not found' }, { status: 404 });
    }

    const definition = await prisma.holidayDefinition.update({
      where: { id },
      data,
    });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: auditUserId,
        description: `Updated holiday rule: ${definition.name}`,
        changes: JSON.stringify({
          before: existing,
          after: definition,
        }),
      },
    });

    return NextResponse.json({ success: true, data: definition });
  } catch (error) {
    console.error('[HolidayDefinitions API - PATCH] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update holiday rule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'HOLIDAY' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = await params;

    const existing = await prisma.holidayDefinition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Holiday rule not found' }, { status: 404 });
    }

    await prisma.holidayDefinition.delete({ where: { id } });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'DELETE',
        userId: auditUserId,
        description: `Deleted holiday rule: ${existing.name}`,
        changes: JSON.stringify({
          before: existing,
          after: null,
        }),
      },
    });

    return NextResponse.json({ success: true, message: 'Holiday rule deleted successfully' });
  } catch (error) {
    console.error('[HolidayDefinitions API - DELETE] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete holiday rule' }, { status: 500 });
  }
}
