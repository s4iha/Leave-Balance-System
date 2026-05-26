import { PrismaClient, AccrualScheme, Gender } from '../generated/prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from 'bcryptjs';

// 1. Initialize the Postgres adapter with your connection string
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// 2. Pass the adapter into the PrismaClient options
const prisma = new PrismaClient({ adapter });

const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};

async function main() {
  console.log('Seeding database...');

  // Clear existing data in correct order (children first)
  await prisma.auditLog.deleteMany();
  await prisma.balanceAdjustment.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.balanceRecord.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.holidayDefinition.deleteMany({});
  await prisma.leaveType.deleteMany();
  await prisma.department.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.employeeClassification.deleteMany();

  // Create permissions
  const pApproveLeave = await prisma.permission.create({ data: { action: 'APPROVE', resource: 'LEAVE_REQUEST' } });
  const pCreateLeaveRequest = await prisma.permission.create({ data: { action: 'CREATE', resource: 'LEAVE_REQUEST' } });
  
  // Leave Types
  const pReadLeaveType = await prisma.permission.create({ data: { action: 'READ', resource: 'LEAVE_TYPE' } });
  const pCreateLeaveType = await prisma.permission.create({ data: { action: 'CREATE', resource: 'LEAVE_TYPE' } });
  const pUpdateLeaveType = await prisma.permission.create({ data: { action: 'UPDATE', resource: 'LEAVE_TYPE' } });
  const pDeleteLeaveType = await prisma.permission.create({ data: { action: 'DELETE', resource: 'LEAVE_TYPE' } });
  const pManageLeaveType = await prisma.permission.create({ data: { action: 'MANAGE', resource: 'LEAVE_TYPE' } });

  // Users
  const pManageUsers = await prisma.permission.create({ data: { action: 'MANAGE', resource: 'USER' } });
  
  // Roles
  const pManageRoles = await prisma.permission.create({ data: { action: 'MANAGE', resource: 'ROLE' } });
  
  // Holidays
  const pManageHolidays = await prisma.permission.create({ data: { action: 'MANAGE', resource: 'HOLIDAY' } });

  // Departments
  const pReadDept = await prisma.permission.create({ data: { action: 'READ', resource: 'DEPARTMENT' } });
  const pCreateDept = await prisma.permission.create({ data: { action: 'CREATE', resource: 'DEPARTMENT' } });
  const pUpdateDept = await prisma.permission.create({ data: { action: 'UPDATE', resource: 'DEPARTMENT' } });
  const pDeleteDept = await prisma.permission.create({ data: { action: 'DELETE', resource: 'DEPARTMENT' } });
  const pManageDept = await prisma.permission.create({ data: { action: 'MANAGE', resource: 'DEPARTMENT' } });

  // Classifications
  const pReadClass = await prisma.permission.create({ data: { action: 'READ', resource: 'CLASSIFICATION' } });
  const pCreateClass = await prisma.permission.create({ data: { action: 'CREATE', resource: 'CLASSIFICATION' } });
  const pUpdateClass = await prisma.permission.create({ data: { action: 'UPDATE', resource: 'CLASSIFICATION' } });
  const pDeleteClass = await prisma.permission.create({ data: { action: 'DELETE', resource: 'CLASSIFICATION' } });
  const pManageClass = await prisma.permission.create({ data: { action: 'MANAGE', resource: 'CLASSIFICATION' } });

  // Balance Policies
  const pReadPolicy = await prisma.permission.create({ data: { action: 'READ', resource: 'BALANCE_POLICY' } });
  const pCreatePolicy = await prisma.permission.create({ data: { action: 'CREATE', resource: 'BALANCE_POLICY' } });
  const pUpdatePolicy = await prisma.permission.create({ data: { action: 'UPDATE', resource: 'BALANCE_POLICY' } });
  const pDeletePolicy = await prisma.permission.create({ data: { action: 'DELETE', resource: 'BALANCE_POLICY' } });
  const pManagePolicy = await prisma.permission.create({ data: { action: 'MANAGE', resource: 'BALANCE_POLICY' } });

  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'System Admin',
      description: 'Full system access',
      color: '#7c3aed',
      isSystem: true,
      permissions: {
        create: [
          { permissionId: pApproveLeave.id },
          { permissionId: pManageUsers.id },
          { permissionId: pManageRoles.id },
          { permissionId: pManageHolidays.id },
          { permissionId: pManageLeaveType.id },
          { permissionId: pManageDept.id },
          { permissionId: pManageClass.id },
          { permissionId: pManagePolicy.id },
        ],
      },
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: 'Manager',
      description: 'Can approve leave requests for team',
      color: '#2563eb',
      isSystem: true,
      permissions: {
        create: [
          { permissionId: pApproveLeave.id },
          { permissionId: pManageUsers.id },
          { permissionId: pReadLeaveType.id },
          { permissionId: pReadDept.id },
          { permissionId: pReadClass.id },
        ],
      },
    },
  });

  const employeeRole = await prisma.role.create({
    data: {
      name: 'Employee',
      description: 'Standard employee access',
      color: '#16a34a',
      isSystem: true,
      permissions: {
        create: [
          { permissionId: pCreateLeaveRequest.id },
          { permissionId: pReadLeaveType.id },
        ],
      },
    },
  });

  // Create classifications
  const regularClassification = await prisma.employeeClassification.create({
    data: { name: 'Regular', description: 'Full-time regular employees' },
  });
  console.log('Created Regular Classification:', regularClassification?.id);

  const contractualClassification = await prisma.employeeClassification.create({
    data: { name: 'Contractual', description: 'Contract-based employees' },
  });
  console.log('Created Contractual Classification:', contractualClassification?.id);

  const probationaryClassification = await prisma.employeeClassification.create({
    data: { name: 'Probationary', description: 'Employees under probation period' },
  });
  console.log('Created Probationary Classification:', probationaryClassification?.id);

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      id: 'admin-id',
      email: 'admin@example.com',
      name: 'Admin User',
      roleId: adminRole.id,
      password: await hashPassword('password'),
      requiresPasswordChange: false,
      active: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      id: 'manager-id',
      email: 'manager@example.com',
      name: 'John Manager',
      roleId: managerRole.id,
      password: await hashPassword('password'),
      requiresPasswordChange: false,
      active: true,
    },
  });

  const employeeUser1 = await prisma.user.create({
    data: {
      id: 'emp1-id',
      email: 'emp1@example.com',
      name: 'Alice Johnson',
      roleId: employeeRole.id,
      password: await hashPassword('password'),
      requiresPasswordChange: true,
      active: true,
    },
  });

  const employeeUser2 = await prisma.user.create({
    data: {
      id: 'emp2-id',
      email: 'emp2@example.com',
      name: 'Bob Smith',
      roleId: employeeRole.id,
      password: await hashPassword('password'),
      requiresPasswordChange: true,
      active: true,
    },
  });

  const employeeUser3 = await prisma.user.create({
    data: {
      id: 'emp3-id',
      email: 'emp3@example.com',
      name: 'Carol White',
      roleId: employeeRole.id,
      password: await hashPassword('password'),
      requiresPasswordChange: true,
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
      gender: Gender.FEMALE,
      classification: { connect: { id: regularClassification.id } },
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
      gender: Gender.MALE,
      classification: { connect: { id: contractualClassification.id } },
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
      gender: Gender.FEMALE,
      classification: { connect: { id: regularClassification.id } },
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
      maxDaysPerYear: 105,
      requiresApproval: true,
      carryoverAllowed: false,
      carryoverMaxDays: null,
      carryoverExpiryDays: null,
      active: true,
    },
  });

  const paternityLeaveType = await prisma.leaveType.create({
    data: {
      name: 'Paternity Leave',
      description: 'Leave for paternity purposes',
      maxDaysPerYear: 7,
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
      endDate: new Date(currentYear, 5, 11),
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

  // Create sample holidays
  const newYearDef = await prisma.holidayDefinition.upsert({
    where: { id: 'new-year-1' },
    update: {},
    create: {
      id: 'new-year-1',
      name: 'New Year\'s Day',
      ruleType: 'FIXED_DATE',
      month: 1,
      day: 1,
      isActive: true,
    },
  });

  await prisma.holidayDefinition.upsert({
    where: { id: 'christmas-1' },
    update: {},
    create: {
      id: 'christmas-1',
      name: 'Christmas Day',
      ruleType: 'FIXED_DATE',
      month: 12,
      day: 25,
      isActive: true,
    },
  });

  console.log('Database seeded successfully!');
  console.log('Demo users (Password: password):');
  console.log(`Admin: ${adminUser.email}`);
  console.log(`Manager: ${managerUser.email}`);
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
