import { prisma } from './db';
import crypto from 'crypto';

type OtpType = 'FORGOT_PASSWORD' | 'TWO_FACTOR' | 'LOGIN';

export async function generateOTP(
  email: string,
  type: OtpType = 'FORGOT_PASSWORD'
) {
  const now = new Date();

  // Generate 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes expiration

  // Deactivate previous unused OTPs for this email/type
  await prisma.oTP.updateMany({
    where: { email, type, used: false },
    data: { used: true } // Effectively deactivating them
  });

  // Create new OTP
  const otp = await prisma.oTP.create({
    data: {
      email,
      code,
      type,
      expiresAt,
    }
  });

  return otp;
}

export async function verifyOTP(
  email: string, 
  code: string, 
  type: OtpType = 'FORGOT_PASSWORD',
  markAsUsed = true
) {
  const now = new Date();

  const otp = await prisma.oTP.findFirst({
    where: {
      email,
      code,
      type,
      used: false,
      expiresAt: { gt: now }
    }
  });

  if (!otp) {
    // Increment attempts for any active OTP for this email
    const activeOtp = await prisma.oTP.findFirst({
      where: { email, type, used: false, expiresAt: { gt: now } }
    });
    
    if (activeOtp) {
      await prisma.oTP.update({
        where: { id: activeOtp.id },
        data: { attempts: { increment: 1 } }
      });
      
      if (activeOtp.attempts + 1 >= 3) {
        await prisma.oTP.update({
          where: { id: activeOtp.id },
          data: { used: true }
        });
        throw new Error('Invalid code. Maximum attempts reached. Please request a new code.');
      }
    }
    
    throw new Error('Invalid or expired code.');
  }

  // Mark as used if requested
  if (markAsUsed) {
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { used: true }
    });
  }

  return true;
}
