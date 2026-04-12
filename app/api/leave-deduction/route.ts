import { NextRequest, NextResponse } from 'next/server';

/**
 * External API Endpoint for Leave Usage Deduction
 * 
 * This endpoint receives approved leave request information from external approval systems
 * and deducts the used days from the employee's leave balance.
 * 
 * Request Format:
 * {
 *   "employeeId": "emp1-id",
 *   "leaveTypeId": "pto-id",
 *   "startDate": "2024-06-15",
 *   "endDate": "2024-06-17",
 *   "durationDays": 3,
 *   "approvalId": "approval-123",
 *   "approvedBy": "manager-id",
 *   "approvalDate": "2024-06-10"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // Verify API key from headers (optional but recommended for production)
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.LEAVE_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing API key' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'employeeId',
      'leaveTypeId',
      'startDate',
      'endDate',
      'durationDays',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate durationDays is a positive number
    if (typeof body.durationDays !== 'number' || body.durationDays <= 0) {
      return NextResponse.json(
        { error: 'durationDays must be a positive number' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Find the employee in the database
    // 2. Find the leave type in the database
    // 3. Get the current balance record for the current year
    // 4. Deduct the used days from the balance
    // 5. Create an audit log entry
    // 6. Return a success response

    console.log('[Leave Deduction API] Processing request:', {
      employeeId: body.employeeId,
      leaveTypeId: body.leaveTypeId,
      durationDays: body.durationDays,
      dates: `${body.startDate} to ${body.endDate}`,
    });

    // Mock database operations
    const simulatedBalanceBefore = 17;
    const simulatedBalanceAfter = simulatedBalanceBefore - body.durationDays;

    const response = {
      success: true,
      message: 'Leave deduction processed successfully',
      data: {
        employeeId: body.employeeId,
        leaveTypeId: body.leaveTypeId,
        deductedDays: body.durationDays,
        previousBalance: simulatedBalanceBefore,
        newBalance: simulatedBalanceAfter,
        startDate: body.startDate,
        endDate: body.endDate,
        processedAt: new Date().toISOString(),
        deductionId: `DED-${Date.now()}`,
      },
    };

    // Log for audit trail
    console.log('[Leave Deduction API] Success:', response);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Leave Deduction API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing leave deduction' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check balance for an employee before deduction
 * 
 * Query Parameters:
 * - employeeId: Employee ID
 * - leaveTypeId: Leave Type ID
 * - year: Year (optional, defaults to current year)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.LEAVE_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing API key' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const leaveTypeId = searchParams.get('leaveTypeId');
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    if (!employeeId || !leaveTypeId) {
      return NextResponse.json(
        { error: 'Missing required parameters: employeeId and leaveTypeId' },
        { status: 400 }
      );
    }

    // In a real implementation, fetch from database
    const mockBalance = {
      employeeId,
      leaveTypeId,
      year: parseInt(year),
      openingBalance: 5,
      accrued: 15,
      used: 3,
      adjusted: 0,
      closingBalance: 17,
      carried: 0,
      lastAccrualDate: new Date().toISOString(),
    };

    const response = {
      success: true,
      data: mockBalance,
      queryTime: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Leave Deduction API - GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while retrieving balance' },
      { status: 500 }
    );
  }
}

/**
 * API Documentation
 * 
 * Base URL: /api/leave-deduction
 * 
 * POST /api/leave-deduction
 * Deduct leave days from an employee's balance
 * Required headers: x-api-key
 * 
 * Example cURL:
 * curl -X POST http://localhost:3000/api/leave-deduction \
 *   -H "Content-Type: application/json" \
 *   -H "x-api-key: your-api-key" \
 *   -d '{
 *     "employeeId": "emp1-id",
 *     "leaveTypeId": "pto-id",
 *     "startDate": "2024-06-15",
 *     "endDate": "2024-06-17",
 *     "durationDays": 3,
 *     "approvalId": "approval-123",
 *     "approvedBy": "manager-id",
 *     "approvalDate": "2024-06-10"
 *   }'
 * 
 * GET /api/leave-deduction?employeeId=emp1-id&leaveTypeId=pto-id&year=2024
 * Get current leave balance for an employee
 * Required headers: x-api-key
 * 
 * Example cURL:
 * curl http://localhost:3000/api/leave-deduction?employeeId=emp1-id&leaveTypeId=pto-id&year=2024 \
 *   -H "x-api-key: your-api-key"
 */
