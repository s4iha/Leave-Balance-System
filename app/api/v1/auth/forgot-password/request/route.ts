import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOTP } from '@/lib/otp';
import { sendEmail } from '@/lib/email';
import { limitOtpByEmail } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const limiterResult = await limitOtpByEmail(email);
    if (!limiterResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limiterResult.limit.toString(),
            'X-RateLimit-Remaining': limiterResult.remaining.toString(),
            'X-RateLimit-Reset': limiterResult.reset.toString(),
          },
        }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if user exists. 
      // But in an internal system, it's often better to be helpful.
      // We'll return success anyway to prevent email enumeration.
      return NextResponse.json({ success: true, message: 'If an account exists, an OTP will be sent.' });
    }

    // Generate OTP
    const otp = await generateOTP(email, 'FORGOT_PASSWORD');

    // Send Email
    await sendEmail({
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Password Reset</h2>
          <p style="color: #475569; line-height: 1.5;">You requested a password reset for your Leave Balance System account. Please use the following One-Time Password (OTP) to proceed:</p>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 6px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp.code}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 5 minutes. If you did not request this reset, please ignore this email or contact your administrator.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">Leave Balance System &bull; Secure Authentication</p>
        </div>
      `,
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: user.id,
        description: `Requested password reset OTP for ${email}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email.',
    });
  } catch (error: any) {
    console.error('[Forgot Password Request] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to request OTP' },
      { status: 500 }
    );
  }
}
