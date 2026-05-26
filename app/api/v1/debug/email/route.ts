import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { authorize } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Only allow System Admins to run debug email tests
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'SYSTEM_SETTING' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await request.json();
    const { to, subject, message } = body;

    if (!to || !subject) {
      return NextResponse.json({ success: false, error: 'Recipient and subject are required' }, { status: 400 });
    }

    const result = await sendEmail({
      to,
      subject: subject || 'LBS Email Test',
      text: message || 'This is a test email from the Leave Balance System diagnostic tool.',
    });

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email sent successfully', 
        messageId: result.messageId 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Debug Email API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
