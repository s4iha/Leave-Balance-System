import { NextRequest } from 'next/server';
import { POST as verifyOtp } from '../forgot-password/verify/route';

export async function POST(request: NextRequest) {
  return verifyOtp(request);
}
