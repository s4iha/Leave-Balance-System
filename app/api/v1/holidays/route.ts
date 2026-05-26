import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/auth-utils';
import { HolidayEngine } from '@/lib/holiday-engine';

export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    const observedDates = await HolidayEngine.getObservedHolidays(year);
    
    // Map to the expected format for the client duration calculation
    const data = Array.from(observedDates).map(dateStr => ({
      id: dateStr,
      date: new Date(dateStr).toISOString(),
      active: true,
      name: 'Holiday',
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Holidays API - GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch holidays' }, { status: 500 });
  }
}
