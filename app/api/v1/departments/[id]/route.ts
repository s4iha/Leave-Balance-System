import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const department = await prisma.department.findUnique({
      where: { id: params.id },
      include: {
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
            active: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, code, description, manager } = body;

    // Verify department exists
    const existing = await prisma.department.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if new code conflicts with other departments
    if (code && code !== existing.code) {
      const codeExists = await prisma.department.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Department code already exists' },
          { status: 400 }
        );
      }
    }

    const department = await prisma.department.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(description !== undefined && { description }),
        ...(manager !== undefined && { managerId: manager }),
      },
    });

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update department' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const department = await prisma.department.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    if (department._count.employees > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete department with active employees. Please reassign or remove employees first.',
        },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete department' },
      { status: 500 }
    );
  }
}
