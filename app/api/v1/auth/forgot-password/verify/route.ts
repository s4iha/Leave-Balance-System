import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ success: false, error: 'Email and code are required' }, { status: 400 });
    }

    await verifyOTP(email, code, 'FORGOT_PASSWORD', false);

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error: any) {
    console.error('[Forgot Password Verify] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 400 }
    );
  }
}
