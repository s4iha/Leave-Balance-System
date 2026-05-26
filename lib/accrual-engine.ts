import { prisma } from './db';
import { AccrualScheme, AuditActionType } from './prisma';

/**
 * Core engine for processing leave accruals.
 * This should be triggered periodically (e.g., via a cron job).
 */
export async function processAccruals() {
  const now = new Date();
  const results = {
    processed: 0,
    errors: 0,
    details: [] as string[],
  };

  try {
    // 1. Find all balance records that are due for accrual
    const recordsToProcess = await prisma.balanceRecord.findMany({
      where: {
        nextAccrualDate: {
          lte: now,
        },
        employee: {
          active: true,
        },
      },
      include: {
        leaveType: true,
        employee: {
          include: { user: true },
        },
      },
    });

    for (const record of recordsToProcess) {
      try {
        await prisma.$transaction(async (tx) => {
          // Calculate accrual amount
          const maxDays = record.leaveType.maxDaysPerYear;
          let accrualAmount = 0;
          let nextAccrualDate = new Date(record.nextAccrualDate);

          switch (record.scheme) {
            case AccrualScheme.MONTHLY:
              accrualAmount = maxDays / 12;
              nextAccrualDate.setMonth(nextAccrualDate.getMonth() + 1);
              break;
            case AccrualScheme.SEMESTER:
              accrualAmount = maxDays / 2;
              nextAccrualDate.setMonth(nextAccrualDate.getMonth() + 6);
              break;
            case AccrualScheme.ANNUAL:
              accrualAmount = maxDays;
              nextAccrualDate.setFullYear(nextAccrualDate.getFullYear() + 1);
              break;
          }

          // Round to 2 decimal places for safety
          accrualAmount = Math.round(accrualAmount * 100) / 100;

          // Update balance record
          const updatedRecord = await tx.balanceRecord.update({
            where: { id: record.id },
            data: {
              accrued: { increment: accrualAmount },
              closingBalance: { increment: accrualAmount },
              lastAccrualDate: record.nextAccrualDate,
              nextAccrualDate: nextAccrualDate,
            },
          });

          // Create audit log
          await tx.auditLog.create({
            data: {
              actionType: AuditActionType.ADJUSTMENT,
              userId: record.employee.userId, // System-triggered, but associated with the employee
              employeeId: record.employeeId,
              description: `Automated accrual of ${accrualAmount} days for ${record.leaveType.name} (${record.scheme})`,
              changes: JSON.stringify({
                before: {
                  accrued: record.accrued,
                  closingBalance: record.closingBalance,
                  nextAccrualDate: record.nextAccrualDate,
                },
                after: {
                  accrued: updatedRecord.accrued,
                  closingBalance: updatedRecord.closingBalance,
                  nextAccrualDate: updatedRecord.nextAccrualDate,
                },
              }),
            },
          });

          results.processed++;
          results.details.push(`Processed ${record.employee.user.name} - ${record.leaveType.name}: +${accrualAmount}`);
        });
      } catch (err) {
        console.error(`Failed to process accrual for record ${record.id}:`, err);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('Error in accrual engine:', error);
    throw error;
  }

  return results;
}
