import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AuditActionType } from '@/lib/prisma';
import { getAuditUserId } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const { actionType, description } = await request.json();

    if (!['LOGIN', 'LOGOUT'].includes(actionType)) {
      return NextResponse.json({ error: 'Invalid auth action type' }, { status: 400 });
    }

    const userId = await getAuditUserId(request);
    
    // For logout, the user ID might still be in the headers if called before clearing
    // For login, the user ID is in the headers if called after setting it in the client
    
    const auditLog = await prisma.auditLog.create({
      data: {
        actionType: actionType as AuditActionType,
        userId,
        description,
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({ success: true, logId: auditLog.id }, { status: 201 });
  } catch (error) {
    console.error('Error logging auth event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
