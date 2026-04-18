import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function getAuditUserId(request: NextRequest): Promise<string> {
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) return headerUserId;

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  if (admin?.id) return admin.id;

  const anyUser = await prisma.user.findFirst({
    select: { id: true },
  });

  if (!anyUser?.id) {
    throw new Error('No users available for audit logging');
  }

  return anyUser.id;
}
