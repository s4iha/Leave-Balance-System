import 'dotenv/config';
import { prisma } from '../lib/db';
import { LeaveRequestStatus } from '../lib/prisma';

async function runTests() {
  console.log('--- Starting LBS Automated API Tests ---');

  // 1. Fetch IDs for testing
  const adminUser = await prisma.user.findFirst({
    where: { role: { name: { equals: 'System Admin', mode: 'insensitive' } } }
  });
  
  // Find an employee and their actual manager for hierarchy tests
  const employeeProfile = await prisma.employee.findFirst({
    where: { managerId: { not: null } },
    include: { user: true, manager: true }
  });

  if (!adminUser || !employeeProfile || !employeeProfile.manager) {
    throw new Error('Required test data not found. Please run pnpm db:seed first.');
  }

  const employeeUser = employeeProfile.user;
  const managerUser = employeeProfile.manager;
  
  const otherEmployeeUser = await prisma.user.findFirst({ 
    where: {
      role: { name: { equals: 'Employee', mode: 'insensitive' } },
      id: { not: employeeUser.id }
    }
  });
  const otherEmployeeProfile = otherEmployeeUser 
    ? await prisma.employee.findUnique({ where: { userId: otherEmployeeUser.id } })
    : null;

  const leaveType = await prisma.leaveType.findFirst({ where: { active: true } });
  const balanceRecord = await prisma.balanceRecord.findFirst({ 
    where: { employeeId: employeeProfile.id, leaveTypeId: leaveType?.id } 
  });


  const baseUrl = 'http://localhost:3000/api/v1';
  const cronSecret = process.env.CRON_SECRET || 'dev-secret-do-not-use-in-prod';

  // Helper for requests
  const callApi = async (path: string, method: string, userId: string, body?: any) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-user-role': 'DUMMY', // Will be ignored as we use DB role
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const text = await res.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { text };
    }
    return { status: res.status, data };
  };


  console.log('\n[Test 1: RBAC - Forbidden Access]');
  // Employee tries to fetch users (Admin only)
  const t1 = await callApi('/users', 'GET', employeeUser.id);
  console.log(`- Employee GET /users: ${t1.status} (Expected 403)`);
  if (t1.status !== 403) throw new Error('RBAC Failure: Employee should not access /users');

  // Employee tries to create an employee (Admin only)
  const t2 = await callApi('/employees', 'POST', employeeUser.id, { name: 'Hack' });
  console.log(`- Employee POST /employees: ${t2.status} (Expected 403)`);
  if (t2.status !== 403) throw new Error('RBAC Failure: Employee should not create employees');

  console.log('\n[Test 2: RBAC - Ownership/Hierarchy]');
  // Employee tries to see other employee's requests
  if (otherEmployeeProfile) {
    const t3 = await callApi(`/requests?employeeId=${otherEmployeeProfile.id}`, 'GET', employeeUser.id);
    // The GET requests route filters results. If employee tries to filter by someone else, they get their own results or error.
    // In our implementation, it filters 'where.employeeId = ownEmployeeId'.
    console.log(`- Employee GET /requests (filter by other): ${t3.status} (Expected 200, results filtered to self)`);
  }

  console.log('\n[Test 3: Atomic Balance Deduction]');
  // Create a request as Employee
  const createReq = await callApi('/requests', 'POST', employeeUser.id, {
    employeeId: employeeProfile?.id,
    leaveTypeId: leaveType?.id,
    startDate: new Date(),
    endDate: new Date(),
    durationDays: 1,
    reason: 'Test request',
  });
  console.log(`- Employee POST /requests: ${createReq.status}`);
  const requestId = (createReq.data as { data?: { id?: string } })?.data?.id;
  if (!requestId) {
    throw new Error('Request creation response missing request id');
  }

  // Check balance before approval
  const balBefore = await prisma.balanceRecord.findUnique({ where: { id: balanceRecord?.id } });
  console.log(`- Balance used before approval: ${balBefore?.used}`);

  // Approve as Manager
  const approveReq = await callApi(`/requests/${requestId}`, 'PATCH', managerUser.id, {
    status: LeaveRequestStatus.APPROVED,
    approvalNotes: 'Testing atomic deduction',
  });
  console.log(`- Manager PATCH /requests/${requestId} (APPROVE): ${approveReq.status}`);

  // Check balance after approval
  const balAfter = await prisma.balanceRecord.findUnique({ where: { id: balanceRecord?.id } });
  console.log(`- Balance used after approval: ${balAfter?.used}`);
  
  if ((balAfter?.used || 0) !== (balBefore?.used || 0) + 1) {
    throw new Error('Atomic Deduction Failure: Balance was not incremented correctly');
  }

  console.log('\n[Test 4: Atomic Balance Revert]');
  // Cancel the approved request
  const cancelReq = await callApi(`/requests/${requestId}`, 'DELETE', employeeUser.id);
  console.log(`- Employee DELETE /requests/${requestId} (CANCEL): ${cancelReq.status}`);

  // Check balance after cancellation
  const balFinal = await prisma.balanceRecord.findUnique({ where: { id: balanceRecord?.id } });
  console.log(`- Balance used after cancellation: ${balFinal?.used}`);
  
  if (balFinal?.used !== balBefore?.used) {
    throw new Error('Atomic Revert Failure: Balance was not reverted correctly');
  }

  console.log('\n[Test 5: Accrual Engine]');
  // Update a record to be due for accrual
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  await prisma.balanceRecord.update({
    where: { id: balanceRecord?.id },
    data: { nextAccrualDate: pastDate }
  });

  const cronRes = await fetch(`${baseUrl}/cron/accrue`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cronSecret}` }
  });
  const cronData = await cronRes.json();
  console.log(`- Cron POST /cron/accrue: ${cronRes.status} (Processed: ${cronData.results.processed})`);
  
  const balAccrued = await prisma.balanceRecord.findUnique({ where: { id: balanceRecord?.id } });
  if ((balAccrued?.accrued || 0) <= (balFinal?.accrued || 0)) {
    throw new Error('Accrual Engine Failure: Balance was not accrued');
  }
  console.log(`- New accrued amount: ${balAccrued?.accrued}`);

  console.log('\n--- ALL TESTS PASSED ---');
}

runTests()
  .catch(e => {
    console.error('\n--- TEST FAILED ---');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
