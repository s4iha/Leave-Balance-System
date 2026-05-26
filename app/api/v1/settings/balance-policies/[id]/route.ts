import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authorize } from '@/lib/auth-utils';
import { getAuditUserId, captureAuditChanges } from '@/lib/audit';
import { z } from 'zod';
import { AccrualScheme, UserRole } from '@/lib/prisma';

const balancePolicyUpdateSchema = z.object({
  initialCredits: z.number().min(0).optional(),
  accrualRate: z.number().min(0).optional(),
  maxCarryover: z.number().min(0).nullable().optional(),
  frequency: z.nativeEnum(AccrualScheme).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authorize(req, [{ action: 'MANAGE', resource: 'BALANCE_POLICY' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const existing = await prisma.balancePolicy.findUnique({
      where: { id: params.id },
      include: {
        leaveType: { select: { name: true } },
        classification: { select: { name: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = balancePolicyUpdateSchema.parse(body);

    const policy = await prisma.balancePolicy.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        leaveType: { select: { name: true } },
        classification: { select: { name: true } }
      }
    });

    // Audit Log
    const auditUserId = await getAuditUserId(req);
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: auditUserId,
        description: `Updated balance policy for ${policy.leaveType.name}${policy.classification ? ` (${policy.classification.name})` : ''}`,
        changes: JSON.stringify(captureAuditChanges(existing, body, policy)),
      },
    });

    return NextResponse.json({ success: true, data: policy });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('[BALANCE_POLICY_PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authorize(req, [{ action: 'MANAGE', resource: 'BALANCE_POLICY' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const deleted = await prisma.balancePolicy.delete({
      where: { id: params.id },
      include: {
        leaveType: { select: { name: true } },
        classification: { select: { name: true } }
      }
    });

    // Audit Log
    const auditUserId = await getAuditUserId(req);
    await prisma.auditLog.create({
      data: {
        actionType: 'DELETE',
        userId: auditUserId,
        description: `Deleted balance policy for ${deleted.leaveType.name}${deleted.classification ? ` (${deleted.classification.name})` : ''}`,
        changes: JSON.stringify({ before: deleted }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[BALANCE_POLICY_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
