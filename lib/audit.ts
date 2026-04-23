import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function getAuditUserId(request: NextRequest): Promise<string> {
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) {
    // First try to find user by the provided ID
    const user = await prisma.user.findUnique({
      where: { id: headerUserId },
      select: { id: true },
    });
    if (user) return headerUserId;
    
    // If the ID is not found, it might be a demo account ID (like 'emp1-id')
    // Try to find by email if there's a header for that
    const headerEmail = request.headers.get('x-user-email');
    if (headerEmail) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: headerEmail },
        select: { id: true },
      });
      if (userByEmail?.id) return userByEmail.id;
    }
  }

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
