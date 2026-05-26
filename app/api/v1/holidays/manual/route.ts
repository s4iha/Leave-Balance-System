import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';
import { authorize } from '@/lib/auth-utils';
import { z } from 'zod';

const manualSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  date: z.string().datetime(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    
    const where: any = {};
    if (yearParam) {
      where.year = parseInt(yearParam, 10);
    }

    const manuals = await prisma.manualHoliday.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    return NextResponse.json({ success: true, data: manuals });
  } catch (error) {
    console.error('[ManualHolidays API - GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch manual holidays' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'HOLIDAY' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await request.json();
    const result = manualSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      );
    }

    const { name, date, notes } = result.data;
    const parsedDate = new Date(date);
    const year = parsedDate.getFullYear();

    const manual = await prisma.manualHoliday.create({
      data: {
        name,
        date: parsedDate,
        year,
        notes,
      }
    });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'CREATE',
        userId: auditUserId,
        description: `Created manual holiday: ${manual.name}`,
        changes: JSON.stringify({
          before: null,
          after: manual,
        }),
      },
    });

    return NextResponse.json({ success: true, data: manual }, { status: 201 });
  } catch (error) {
    console.error('[ManualHolidays API - POST] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create manual holiday' }, { status: 500 });
  }
}
