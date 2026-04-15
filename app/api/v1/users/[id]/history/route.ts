import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch role change history from audit logs
    const history = await prisma.auditLog.findMany({
      where: {
        AND: [
          { resourceId: params.id },
          { resourceType: 'USER_ROLE' },
          { actionType: 'UPDATE' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Parse and format the data
    const formattedHistory = history.map((log) => {
      let changes = { oldRole: '', newRole: '', reason: '' };
      try {
        changes = JSON.parse(log.changes || '{}');
      } catch (e) {
        // Handle parsing error
      }

      return {
        id: log.id,
        timestamp: log.createdAt,
        changedBy: log.userId,
        oldRole: changes.oldRole || '',
        newRole: changes.newRole || '',
        reason: changes.reason || '',
        description: log.description,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: params.id,
        userName: user.email,
        history: formattedHistory,
      },
    });
  } catch (error) {
    console.error('Error fetching user role history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user history' },
      { status: 500 }
    );
  }
}
