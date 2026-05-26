import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId, captureAuditChanges } from '@/lib/audit';
import { authorize } from '@/lib/auth-utils';
import { UserRole } from '@/lib/prisma';

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

    return NextResponse.json({ success: true, data: leaveType }, { status: 200 });
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
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'LEAVE_TYPE' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

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
    const auditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        userId: auditUserId,
        description: `Updated leave type: ${updated.name}`,
        changes: JSON.stringify(captureAuditChanges(leaveType, body, updated)),
      },
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error('Error updating leave type:', error);
    return NextResponse.json(
      { error: 'Failed to update leave type' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/leave-types/[id] - Delete leave type (soft delete with reference checking)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'LEAVE_TYPE' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const forceDelete = searchParams.get('force') === 'true';

    const leaveType = await prisma.leaveType.findUnique({
      where: { id },
    });

    if (!leaveType) {
      return NextResponse.json({ error: 'Leave type not found' }, { status: 404 });
    }

    // Check for active requests using this leave type
    const activeRequests = await prisma.leaveRequest.count({
      where: {
        leaveTypeId: id,
        status: { in: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
      },
    });

    // Check for balance records
    const balanceRecords = await prisma.balanceRecord.count({
      where: { leaveTypeId: id },
    });

    // If there are references and forceDelete is not set, return conflict
    if ((activeRequests > 0 || balanceRecords > 0) && !forceDelete) {
      return NextResponse.json(
        {
          error: 'Cannot delete leave type with active requests or balance records',
          activeRequests,
          balanceRecords,
          message: `This leave type has ${activeRequests} active request(s) and ${balanceRecords} balance record(s). Use force=true to delete anyway.`,
        },
        { status: 409 }
      );
    }

    // Soft delete by marking as inactive
    await prisma.leaveType.update({
      where: { id },
      data: { active: false },
    });

    // Create audit log with additional context
    const deleteAuditUserId = await getAuditUserId(request);
    await prisma.auditLog.create({
      data: {
        actionType: 'DELETE',
        userId: deleteAuditUserId,
        description: `Deleted leave type: ${leaveType.name} (force=${forceDelete}, activeRequests=${activeRequests}, balanceRecords=${balanceRecords})`,
        changes: JSON.stringify({ before: leaveType }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Leave type deleted successfully',
        data: {
          id: leaveType.id,
          name: leaveType.name,
          activeRequests,
          balanceRecords,
        },
      },
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
