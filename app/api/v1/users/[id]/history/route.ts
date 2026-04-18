import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch role change history from audit logs
    const history = await prisma.auditLog.findMany({
      where: { actionType: 'UPDATE' },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Parse and format the data
    const formattedHistory = history
      .map((log: (typeof history)[number]) => {
        let changes = { oldRole: '', newRole: '', reason: '', targetUserId: '' };
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
          targetUserId: changes.targetUserId || '',
          description: log.description,
        };
      })
      .filter((entry) => entry.targetUserId === id)
      .map(({ targetUserId, ...entry }) => entry);

    return NextResponse.json({
      success: true,
      data: {
        userId: id,
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
