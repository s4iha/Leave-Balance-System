import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyOTP } from '@/lib/otp';
import { hashPassword } from '@/lib/password-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json({ success: false, error: 'Email, code, and new password are required' }, { status: 400 });
    }

    const passwordRules = [
      { regex: /.{8,}/, message: 'Password must be at least 8 characters long' },
      { regex: /[a-z]/, message: 'Password must include a lowercase letter' },
      { regex: /[A-Z]/, message: 'Password must include an uppercase letter' },
      { regex: /[0-9]/, message: 'Password must include a number' },
      { regex: /[^A-Za-z0-9]/, message: 'Password must include a special character' },
    ];
    for (const rule of passwordRules) {
      if (!rule.regex.test(newPassword)) {
        return NextResponse.json({ success: false, error: rule.message }, { status: 400 });
      }
    }

    // Verify OTP and mark as used
    await verifyOTP(email, code, 'FORGOT_PASSWORD', true);

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        requiresPasswordChange: false,
      },
    });

    // Audit Log
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.auditLog.create({
        data: {
          actionType: 'UPDATE',
          userId: user.id,
          description: `Reset password for ${email} via OTP`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully.',
    });
  } catch (error: any) {
    console.error('[Forgot Password Reset] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Reset failed' },
      { status: 400 }
    );
  }
}
