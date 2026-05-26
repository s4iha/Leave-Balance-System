import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    if (key.trim().length === 0) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    return NextResponse.json(setting, { status: 200 });
  } catch (error) {
    console.error('Error fetching setting by key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setting' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    if (key.trim().length === 0) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }
    const body = await request.json() as Record<string, unknown>;

    if (!('value' in body)) {
      return NextResponse.json(
        { error: 'Missing required field: value' },
        { status: 400 }
      );
    }

    const nextValue = body.value;
    if (
      nextValue === null ||
      nextValue === undefined ||
      (typeof nextValue !== 'string' &&
        typeof nextValue !== 'number' &&
        typeof nextValue !== 'boolean')
    ) {
      return NextResponse.json(
        { error: 'value must be a string, number, or boolean' },
        { status: 400 }
      );
    }

    const existing = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.systemSetting.update({
      where: { key },
      data: { value: String(nextValue) },
    });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: auditUserId,
        description: `Updated system setting: ${key}`,
        changes: JSON.stringify({
          before: existing.value,
          after: updated.value,
        }),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating setting by key:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    if (key.trim().length === 0) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }
    const existing = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    await prisma.systemSetting.delete({
      where: { key },
    });

    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'DELETE',
        userId: auditUserId,
        description: `Deleted system setting: ${key}`,
        changes: JSON.stringify({
          key,
          deletedValue: existing.value,
        }),
      },
    });

    return NextResponse.json(
      { message: 'Setting deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting setting by key:', error);
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}
