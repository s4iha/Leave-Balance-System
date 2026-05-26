import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authorize } from '@/lib/auth-utils';
import { getAuditUserId, captureAuditChanges } from '@/lib/audit';
import { z } from 'zod';
import { AccrualScheme } from '@/lib/prisma';

const balancePolicySchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave Type is required'),
  classificationId: z.string().nullable().optional(),
  initialCredits: z.number().min(0).default(0),
  accrualRate: z.number().min(0).default(0),
  maxCarryover: z.number().min(0).nullable().optional(),
  frequency: z.nativeEnum(AccrualScheme).default(AccrualScheme.MONTHLY),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, [{ action: 'READ', resource: 'BALANCE_POLICY' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const policies = await prisma.balancePolicy.findMany({
      include: {
        leaveType: {
          select: { name: true }
        },
        classification: {
          select: { name: true }
        }
      },
      orderBy: [
        { leaveType: { name: 'asc' } },
        { classification: { name: 'asc' } }
      ]
    });

    return NextResponse.json({ success: true, data: policies });
  } catch (error: any) {
    console.error('[BALANCE_POLICIES_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, [{ action: 'MANAGE', resource: 'BALANCE_POLICY' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await req.json();
    const validatedData = balancePolicySchema.parse(body);

    // Check if a policy already exists for this combination
    const existing = await prisma.balancePolicy.findUnique({
      where: {
        leaveTypeId_classificationId: {
          leaveTypeId: validatedData.leaveTypeId,
          classificationId: validatedData.classificationId || null as any,
        }
      }
    });

    if (existing) {
      return NextResponse.json({
        error: 'A policy already exists for this leave type and classification'
      }, { status: 400 });
    }

    const policy = await prisma.balancePolicy.create({
      data: {
        ...validatedData,
        classificationId: validatedData.classificationId || null,
      },
      include: {
        leaveType: { select: { name: true } },
        classification: { select: { name: true } }
      }
    });

    // Audit Log
    const auditUserId = await getAuditUserId(req);
    await prisma.auditLog.create({
      data: {
        actionType: 'CREATE',
        userId: auditUserId,
        description: `Created balance policy for ${policy.leaveType.name}${policy.classification ? ` (${policy.classification.name})` : ''}`,
        changes: JSON.stringify(captureAuditChanges({}, body, policy)),
      },
    });

    return NextResponse.json({ success: true, data: policy });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('[BALANCE_POLICIES_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
