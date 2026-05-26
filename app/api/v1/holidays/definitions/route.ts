import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';
import { authorize } from '@/lib/auth-utils';
import { z } from 'zod';
import { RuleType, OffsetRule } from '@/lib/prisma';

const definitionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  ruleType: z.nativeEnum(RuleType),
  month: z.number().min(1).max(12).optional().nullable(),
  day: z.number().min(1).max(31).optional().nullable(),
  weekday: z.number().min(0).max(6).optional().nullable(),
  nth: z.number().optional().nullable(),
  offsetRule: z.nativeEnum(OffsetRule).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request);
    if ('errorResponse' in auth) return auth.errorResponse;

    const definitions = await prisma.holidayDefinition.findMany({
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ success: true, data: definitions });
  } catch (error) {
    console.error('[HolidayDefinitions API - GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch holiday rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'HOLIDAY' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await request.json();
    const result = definitionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      );
    }

    const data = result.data;

    const definition = await prisma.holidayDefinition.create({
      data: {
        name: data.name,
        ruleType: data.ruleType,
        month: data.month,
        day: data.day,
        weekday: data.weekday,
        nth: data.nth,
        offsetRule: data.offsetRule ?? OffsetRule.NONE,
        isActive: data.isActive ?? true
      }
    });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'CREATE',
        userId: auditUserId,
        description: `Created holiday rule: ${definition.name}`,
        changes: JSON.stringify({
          before: null,
          after: definition,
        }),
      },
    });

    return NextResponse.json({ success: true, data: definition }, { status: 201 });
  } catch (error) {
    console.error('[HolidayDefinitions API - POST] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create holiday rule' }, { status: 500 });
  }
}
