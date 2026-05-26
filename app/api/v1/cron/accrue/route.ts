import { NextRequest, NextResponse } from 'next/server';
import { processAccruals } from '@/lib/accrual-engine';

/**
 * API route to trigger automated leave accruals.
 * In production, this should be called by a cron job (e.g., Vercel Cron, GitHub Actions).
 * 
 * Authentication: Requires 'Authorization: Bearer <CRON_SECRET>' header.
 */
export async function POST(request: NextRequest) {
  try {
    // Basic security check
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-do-not-use-in-prod';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = await processAccruals();

    return NextResponse.json({
      success: true,
      message: 'Accrual processing completed',
      results,
    });
  } catch (error) {
    console.error('[Accrual Cron API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during accrual processing' },
      { status: 500 }
    );
  }
}

// Also allow GET for manual testing in dev if needed (optional, but keeping it POST for security)
export async function GET(request: NextRequest) {
  return POST(request);
}
