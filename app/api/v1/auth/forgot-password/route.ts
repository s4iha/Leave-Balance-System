import { NextRequest } from 'next/server';
import { POST as requestOtp } from './request/route';

export async function POST(request: NextRequest) {
  return requestOtp(request);
}
