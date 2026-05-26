import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuditUserId } from '@/lib/audit';
import { authorize } from '@/lib/auth-utils';
import { buildOnboardingEmail, sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request, [{ action: 'MANAGE', resource: 'USER' }]);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await request.json();
    const { employees } = body;

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ error: 'Invalid employees data' }, { status: 400 });
    }

    const auditUserId = await getAuditUserId(request);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const results = [];
    const errors = [];

    // Process each employee
    // Using a loop instead of Promise.all to avoid connection pool issues for very large imports
    // and to handle partial successes
    for (const empData of employees) {
      try {
        const { email, name, departmentId, department, designation, managerId, accrualScheme, hireDate } = empData;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          errors.push({ email, error: 'User with this email already exists' });
          continue;
        }

        const resolvedDepartment = departmentId
          ? await prisma.department.findUnique({ where: { id: departmentId } })
          : department
            ? await prisma.department.findFirst({
                where: {
                  OR: [
                    { id: department },
                    { name: { equals: department, mode: 'insensitive' } },
                    { code: { equals: department, mode: 'insensitive' } },
                  ],
                },
              })
            : null;

        if (!resolvedDepartment) {
          errors.push({ email, error: `Department not found: ${departmentId || department}` });
          continue;
        }

        // Generate default password
        const { generateDefaultPassword, hashPassword } = await import('@/lib/password-utils');
        const defaultPassword = generateDefaultPassword(name);
        const hashedPassword = await hashPassword(defaultPassword);

        // Transaction for user and employee creation
        const result = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              name,
              role: {
                connect: { name: 'Employee' },
              },
              password: hashedPassword,
              requiresPasswordChange: true,
              active: true,
            },
          });

          const employee = await tx.employee.create({
            data: {
              userId: user.id,
              departmentId: resolvedDepartment.id,
              designation,
              managerId: managerId || null,
              accrualScheme: accrualScheme || 'MONTHLY',
              hireDate: new Date(hireDate),
              active: true,
            },
            include: { user: true },
          });

          await tx.auditLog.create({
            data: {
              actionType: 'CREATE',
              userId: auditUserId,
              employeeId: employee.id,
              description: `Created employee via bulk import: ${name}`,
            },
          });

          return employee;
        });

        results.push(result);

        const onboardingEmail = buildOnboardingEmail({
          name,
          email,
          temporaryPassword: defaultPassword,
          appUrl,
        });

        sendEmail({
          to: email,
          ...onboardingEmail,
        }).then(async (emailResult) => {
          await prisma.auditLog.create({
            data: {
              actionType: 'UPDATE',
              userId: auditUserId,
              employeeId: result.id,
              description: emailResult.success
                ? `Onboarding email sent successfully to ${email}`
                : `Failed to send onboarding email to ${email}: ${emailResult.error}`,
            },
          });
        }).catch(err => console.error('[Onboarding Email - Bulk] Unexpected Error:', err));
      } catch (err) {
        console.error('Error importing employee:', empData.email, err);
        errors.push({ email: empData.email, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      imported: results,
      failed: errors,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in bulk employee import:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
