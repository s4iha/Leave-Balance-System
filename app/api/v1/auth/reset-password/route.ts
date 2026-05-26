import { NextRequest } from 'next/server';
import { POST as resetPassword } from '../forgot-password/reset/route';

export async function POST(request: NextRequest) {
  return resetPassword(request);
}
