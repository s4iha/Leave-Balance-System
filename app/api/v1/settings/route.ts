import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/v1/settings - Fetch system settings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (key) {
      const setting = await prisma.systemSetting.findUnique({ where: { key } });
      if (!setting) {
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      }
      return NextResponse.json(setting, { status: 200 });
    }

    const settings = await prisma.systemSetting.findMany();
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/v1/settings - Create or update system setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: key, value' },
        { status: 400 }
      );
    }

    // Check if setting exists
    const existing = await prisma.systemSetting.findUnique({ where: { key } });

    let setting;
    if (existing) {
      setting = await prisma.systemSetting.update({
        where: { key },
        data: { value: String(value) },
      });
    } else {
      setting = await prisma.systemSetting.create({
        data: { key, value: String(value) },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actionType: existing ? 'UPDATE' : 'CREATE',
        userId: request.headers.get('x-user-id') || 'system',
        description: `${existing ? 'Updated' : 'Created'} system setting: ${key}`,
      },
    });

    return NextResponse.json(setting, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Error managing setting:', error);
    return NextResponse.json(
      { error: 'Failed to manage setting' },
      { status: 500 }
    );
  }
}
