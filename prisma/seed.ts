import 'dotenv/config'
import { PrismaClient, AccrualScheme, UserRole } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Initialize the Postgres adapter with your connection string
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// 2. Pass the adapter into the PrismaClient options
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.balanceAdjustment.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.balanceRecord.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      active: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      name: 'John Manager',
      role: UserRole.MANAGER,
      active: true,
    },
  });

  const employeeUser1 = await prisma.user.create({
    data: {
      email: 'emp1@example.com',
      name: 'Alice Johnson',
      role: UserRole.EMPLOYEE,
      active: true,
    },
  });

  const employeeUser2 = await prisma.user.create({
    data: {
      email: 'emp2@example.com',
      name: 'Bob Smith',
      role: UserRole.EMPLOYEE,
      active: true,
    },
  });

  const employeeUser3 = await prisma.user.create({
    data: {
      email: 'emp3@example.com',
      name: 'Carol White',
      role: UserRole.EMPLOYEE,
      active: true,
    },
  });

  // Create departments
  const engineeringDepartment = await prisma.department.create({
    data: {
      name: 'Engineering',
      code: 'ENG',
      description: 'Software engineering and development',
      active: true,
    },
  });

  const salesDepartment = await prisma.department.create({
    data: {
      name: 'Sales',
      code: 'SALES',
      description: 'Sales and business development',
      active: true,
    },
  });

  const hrDepartment = await prisma.department.create({
    data: {
      name: 'Human Resources',
      code: 'HR',
      description: 'People operations and HR',
      active: true,
    },
  });

  // Create employees
  const employee1 = await prisma.employee.create({
    data: {
      user: { connect: { id: employeeUser1.id } },
      department: { connect: { id: engineeringDepartment.id } },
      designation: 'Senior Engineer',
      manager: { connect: { id: managerUser.id } },
      accrualScheme: AccrualScheme.MONTHLY,
      hireDate: new Date('2020-01-15'),
      active: true,
    },
  });

  const employee2 = await prisma.employee.create({
    data: {
      user: { connect: { id: employeeUser2.id } },
      department: { connect: { id: salesDepartment.id } },
      designation: 'Sales Executive',
      manager: { connect: { id: managerUser.id } },
      accrualScheme: AccrualScheme.MONTHLY,
      hireDate: new Date('2021-06-01'),
      active: true,
    },
  });

  const employee3 = await prisma.employee.create({
    data: {
      user: { connect: { id: employeeUser3.id } },
      department: { connect: { id: hrDepartment.id } },
      designation: 'HR Manager',
      manager: { connect: { id: managerUser.id } },
      accrualScheme: AccrualScheme.ANNUAL,
      hireDate: new Date('2019-03-10'),
      active: true,
    },
  });

  // Create leave types
  const ptoLeaveType = await prisma.leaveType.create({
    data: {
      name: 'Paid Time Off (PTO)',
      description: 'General paid time off for vacation and personal reasons',
      maxDaysPerYear: 20,
      requiresApproval: true,
      carryoverAllowed: true,
      carryoverMaxDays: 5,
      carryoverExpiryDays: 365,
      active: true,
    },
  });

  const sickLeaveType = await prisma.leaveType.create({
    data: {
      name: 'Sick Leave',
      description: 'Leave for illness and medical reasons',
      maxDaysPerYear: 10,
      requiresApproval: true,
      carryoverAllowed: false,
      carryoverMaxDays: null,
      carryoverExpiryDays: null,
      active: true,
    },
  });

  const casualLeaveType = await prisma.leaveType.create({
    data: {
      name: 'Casual Leave',
      description: 'Casual leave for personal reasons',
      maxDaysPerYear: 8,
      requiresApproval: false,
      carryoverAllowed: false,
      carryoverMaxDays: null,
      carryoverExpiryDays: null,
      active: true,
    },
  });

  const maternityLeaveType = await prisma.leaveType.create({
    data: {
      name: 'Maternity Leave',
      description: 'Leave for maternity purposes',
      maxDaysPerYear: 90,
      requiresApproval: true,
      carryoverAllowed: false,
      carryoverMaxDays: null,
      carryoverExpiryDays: null,
      active: true,
    },
  });

  const currentYear = new Date().getFullYear();

  // Create balance records for employee 1
  const balance1_pto = await prisma.balanceRecord.create({
    data: {
      employeeId: employee1.id,
      leaveTypeId: ptoLeaveType.id,
      year: currentYear,
      scheme: AccrualScheme.MONTHLY,
      openingBalance: 5,
      accrued: 15,
      used: 3,
      adjusted: 0,
      closingBalance: 17,
      carried: 0,
      lastAccrualDate: new Date(currentYear, 0, 1),
      nextAccrualDate: new Date(currentYear + 1, 0, 1),
    },
  });

  const balance1_sick = await prisma.balanceRecord.create({
    data: {
      employeeId: employee1.id,
      leaveTypeId: sickLeaveType.id,
      year: currentYear,
      scheme: AccrualScheme.MONTHLY,
      openingBalance: 10,
      accrued: 0,
      used: 2,
      adjusted: 0,
      closingBalance: 8,
      carried: 0,
      lastAccrualDate: new Date(currentYear, 0, 1),
      nextAccrualDate: new Date(currentYear + 1, 0, 1),
    },
  });

  const balance1_casual = await prisma.balanceRecord.create({
    data: {
      employeeId: employee1.id,
      leaveTypeId: casualLeaveType.id,
      year: currentYear,
      scheme: AccrualScheme.MONTHLY,
      openingBalance: 8,
      accrued: 0,
      used: 1,
      adjusted: 0,
      closingBalance: 7,
      carried: 0,
      lastAccrualDate: new Date(currentYear, 0, 1),
      nextAccrualDate: new Date(currentYear + 1, 0, 1),
    },
  });

  // Create balance records for employee 2
  const balance2_pto = await prisma.balanceRecord.create({
    data: {
      employeeId: employee2.id,
      leaveTypeId: ptoLeaveType.id,
      year: currentYear,
      scheme: AccrualScheme.MONTHLY,
      openingBalance: 2,
      accrued: 12,
      used: 5,
      adjusted: 0,
      closingBalance: 9,
      carried: 0,
      lastAccrualDate: new Date(currentYear, 0, 1),
      nextAccrualDate: new Date(currentYear + 1, 0, 1),
    },
  });

  const balance2_sick = await prisma.balanceRecord.create({
    data: {
      employeeId: employee2.id,
      leaveTypeId: sickLeaveType.id,
      year: currentYear,
      scheme: AccrualScheme.MONTHLY,
      openingBalance: 10,
      accrued: 0,
      used: 0,
      adjusted: 0,
      closingBalance: 10,
      carried: 0,
      lastAccrualDate: new Date(currentYear, 0, 1),
      nextAccrualDate: new Date(currentYear + 1, 0, 1),
    },
  });

  // Create balance records for employee 3
  const balance3_pto = await prisma.balanceRecord.create({
    data: {
      employeeId: employee3.id,
      leaveTypeId: ptoLeaveType.id,
      year: currentYear,
      scheme: AccrualScheme.ANNUAL,
      openingBalance: 0,
      accrued: 20,
      used: 8,
      adjusted: 2,
      closingBalance: 14,
      carried: 0,
      lastAccrualDate: new Date(currentYear, 0, 1),
      nextAccrualDate: new Date(currentYear + 1, 0, 1),
    },
  });

  const balance3_maternity = await prisma.balanceRecord.create({
    data: {
      employeeId: employee3.id,
      leaveTypeId: maternityLeaveType.id,
      year: currentYear,
      scheme: AccrualScheme.ANNUAL,
      openingBalance: 90,
      accrued: 0,
      used: 0,
      adjusted: 0,
      closingBalance: 90,
      carried: 0,
      lastAccrualDate: new Date(currentYear, 0, 1),
      nextAccrualDate: new Date(currentYear + 1, 0, 1),
    },
  });

  // Create some leave requests
  const leaveRequest1 = await prisma.leaveRequest.create({
    data: {
      employeeId: employee1.id,
      leaveTypeId: ptoLeaveType.id,
      balanceRecordId: balance1_pto.id,
      startDate: new Date(currentYear, 4, 15),
      endDate: new Date(currentYear, 4, 17),
      durationDays: 3,
      reason: 'Summer vacation',
      status: 'APPROVED',
      approvedBy: managerUser.id,
      approvalDate: new Date(),
      approvalNotes: 'Approved for team coverage',
    },
  });

  const leaveRequest2 = await prisma.leaveRequest.create({
    data: {
      employeeId: employee2.id,
      leaveTypeId: sickLeaveType.id,
      balanceRecordId: balance2_sick.id,
      startDate: new Date(currentYear, 5, 10),
      endDate: new Date(currentYear, 5, 10),
      durationDays: 1,
      reason: 'Medical appointment',
      status: 'SUBMITTED',
      approvedBy: null,
      approvalDate: null,
      approvalNotes: null,
    },
  });

  // Create a balance adjustment
  await prisma.balanceAdjustment.create({
    data: {
      employeeId: employee3.id,
      leaveTypeId: ptoLeaveType.id,
      adjustmentType: 'bonus',
      adjustmentDays: 2,
      reason: 'Performance bonus',
      approvedBy: adminUser.id,
      approvalDate: new Date(),
      effectiveDate: new Date(),
    },
  });

  // Create audit logs
  await prisma.auditLog.create({
    data: {
      actionType: 'CREATE',
      userId: adminUser.id,
      employeeId: employee1.id,
      description: 'Employee profile created',
      createdAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actionType: 'APPROVE',
      userId: managerUser.id,
      leaveRequestId: leaveRequest1.id,
      description: 'Leave request approved',
      createdAt: new Date(),
    },
  });

  // Create system settings
  await prisma.systemSetting.create({
    data: {
      key: 'fiscalYearStart',
      value: '01-01',
    },
  });

  await prisma.systemSetting.create({
    data: {
      key: 'fiscalYearEnd',
      value: '12-31',
    },
  });

  console.log('Database seeded successfully!');
  console.log('Demo users:');
  console.log(`Admin: ${adminUser.email} (password: admin)`);
  console.log(`Manager: ${managerUser.email} (password: manager)`);
  console.log(`Employee 1: ${employeeUser1.email} (${employeeUser1.name})`);
  console.log(`Employee 2: ${employeeUser2.email} (${employeeUser2.name})`);
  console.log(`Employee 3: ${employeeUser3.email} (${employeeUser3.name})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
