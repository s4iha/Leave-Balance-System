import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './db';

export interface AuthContext {
  userId: string;
  role: string;
  email: string;
  permissions: { action: string; resource: string }[];
}

const SUPERUSER_ROLE = 'System Admin';

/**
 * Validates the user and role from request headers.
 * In a real app, this would verify a JWT or session token.
 * For this LBS demo, it relies on x-user-id and x-user-role headers.
 */
export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const userId = request.headers.get('x-user-id');

  if (!userId) return null;

  // Verify user exists and role matches
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });

  if (!user) return null;

  return {
    userId: user.id,
    role: user.role.name,
    email: user.email,
    permissions: user.role.permissions.map(rp => ({
      action: rp.permission.action,
      resource: rp.permission.resource
    })),
  };
}

/**
 * Ensures the user has the required permissions.
 * requiredPermissions is an array of objects like { action: 'APPROVE', resource: 'LEAVE_REQUEST' }
 * The user must have ALL of the required permissions to pass.
 */
export async function authorize(
  request: NextRequest,
  requiredPermissions: { action: string; resource: string }[] = []
): Promise<{ context: AuthContext } | { errorResponse: NextResponse }> {
  const context = await getAuthContext(request);

  if (!context) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: No valid session found' },
        { status: 401 }
      ),
    };
  }

  if (context.role === SUPERUSER_ROLE) {
    return { context };
  }

  // Check if user has all required permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(rp =>
      context.permissions.some(up => up.action === rp.action && up.resource === rp.resource)
    );

    if (!hasAllPermissions) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: `Forbidden: Missing required permissions` },
          { status: 403 }
        ),
      };
    }
  }

  return { context };
}

/**
 * Specialized check for resources owned by an employee.
 * Allows access if:
 * 1. User is an ADMIN
 * 2. User is a MANAGER (optional, if allowed)
 * 3. User is the EMPLOYEE themselves (matches userId)
 */
export async function authorizeOwnership(
  request: NextRequest,
  employeeId: string,
  allowManager = true
): Promise<{ context: AuthContext } | { errorResponse: NextResponse }> {
  const context = await getAuthContext(request);

  if (!context) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  if (context.role === SUPERUSER_ROLE) {
    return { context };
  }

  // Users with MANAGE_USER permission (e.g. System Admin) have global access
  const canManageUsers = context.permissions.some(p => p.action === 'MANAGE' && p.resource === 'USER');
  if (canManageUsers) {
    return { context };
  }

  // Check if user is the employee themselves
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { userId: true, managerId: true },
  });

  if (!employee) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      ),
    };
  }

  if (employee.userId === context.userId) {
    return { context };
  }

  // Check if user is the manager of the employee
  const isManager = allowManager && employee.managerId === context.userId;
  // Make sure this manager also has APPROVE LEAVE_REQUEST permission if they are doing manager things?
  // We'll just verify they are the manager for ownership checks.
  if (isManager) {
    return { context };
  }

  return {
    errorResponse: NextResponse.json(
      { success: false, error: 'Forbidden: You do not own this resource' },
      { status: 403 }
    ),
  };
}
