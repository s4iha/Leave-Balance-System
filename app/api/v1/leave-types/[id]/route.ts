import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/v1/leave-types/[id] - Fetch leave type by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaveType = await prisma.leaveType.findUnique({
      where: { id },
    });

    if (!leaveType) {
      return NextResponse.json({ error: 'Leave type not found' }, { status: 404 });
    }

    return NextResponse.json(leaveType, { status: 200 });
  } catch (error) {
    console.error('Error fetching leave type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave type' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/leave-types/[id] - Update leave type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      maxDaysPerYear,
      requiresApproval,
      carryoverAllowed,
      carryoverMaxDays,
      carryoverExpiryDays,
      active,
    } = body;

    const leaveType = await prisma.leaveType.findUnique({
      where: { id },
    });

    if (!leaveType) {
      return NextResponse.json({ error: 'Leave type not found' }, { status: 404 });
    }

    const updated = await prisma.leaveType.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(maxDaysPerYear !== undefined && { maxDaysPerYear }),
        ...(requiresApproval !== undefined && { requiresApproval }),
        ...(carryoverAllowed !== undefined && { carryoverAllowed }),
        ...(carryoverMaxDays !== undefined && { carryoverMaxDays }),
        ...(carryoverExpiryDays !== undefined && { carryoverExpiryDays }),
        ...(active !== undefined && { active }),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: request.headers.get('x-user-id') || 'system',
        description: `Updated leave type: ${updated.name}`,
        changes: JSON.stringify(body),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating leave type:', error);
    return NextResponse.json(
      { error: 'Failed to update leave type' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/leave-types/[id] - Delete leave type (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaveType = await prisma.leaveType.findUnique({
      where: { id },
    });

    if (!leaveType) {
      return NextResponse.json({ error: 'Leave type not found' }, { status: 404 });
    }

    // Soft delete by marking as inactive
    await prisma.leaveType.update({
      where: { id },
      data: { active: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actionType: 'DELETE',
        userId: request.headers.get('x-user-id') || 'system',
        description: `Deleted leave type: ${leaveType.name}`,
      },
    });

    return NextResponse.json(
      { message: 'Leave type deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting leave type:', error);
    return NextResponse.json(
      { error: 'Failed to delete leave type' },
      { status: 500 }
    );
  }
}
