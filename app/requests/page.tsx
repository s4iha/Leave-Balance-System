'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { MainContent } from '@/components/layout/main-content';
import { MobileHeader } from '@/components/layout/mobile-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Calendar, Trash2, Clock, AlertCircle } from 'lucide-react';
import { addDays } from 'date-fns';
import { toast, showErrorToast } from '@/lib/sonner-toast';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { ApiError, apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { LeaveRequestStatus } from '@/generated/prisma/enums';
import { useSidebarLayout } from '@/components/layout/sidebar-context';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { SkeletonTable } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmployeeLookupResponse {
  employees: Array<{
    id: string;
    user: {
      email: string;
    };
  }>;
}

interface LeaveType {
  id: string;
  name: string;
}

interface LeaveTypeListResponse {
  leaveTypes: LeaveType[];
}

interface Holiday {
  id: string;
  date: string;
  active: boolean;
}

interface HolidayListResponse {
  success: boolean;
  data: Holiday[];
}

interface LeaveRequestRecord {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  status: LeaveRequestStatus;
  createdAt: string;
  approvalDate: string | null;
  approvalNotes: string | null;
  employee: {
    user: {
      name: string;
      email: string;
    };
  };
  leaveType: {
    name: string;
  };
  approver: {
    name: string;
  } | null;
}

interface RequestsResponse {
  data: LeaveRequestRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary?: Record<LeaveRequestStatus, number>;
}

interface RequestFormData {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
type StatusFilter = 'ALL' | LeaveRequestStatus;
type StatusConfig = Record<LeaveRequestStatus, { color: BadgeVariant }>;

const statusConfig: StatusConfig = {
  DRAFT: { color: 'secondary' },
  SUBMITTED: { color: 'outline' },
  APPROVED: { color: 'default' },
  REJECTED: { color: 'destructive' },
  CANCELLED: { color: 'secondary' },
};

const getEmptyForm = (): RequestFormData => ({
  leaveTypeId: '',
  startDate: '',
  endDate: '',
  reason: '',
});

const getLocalTodayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const adjustedDate = new Date(now.getTime() - offset * 60 * 1000);
  return adjustedDate.toISOString().split('T')[0];
};

const getLocalTomorrowString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const adjustedDate = new Date(now.getTime() - offset * 60 * 1000);
  adjustedDate.setDate(adjustedDate.getDate() + 1);
  return adjustedDate.toISOString().split('T')[0];
};

const getLocalTodayDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};
const editableStatuses: LeaveRequestStatus[] = [LeaveRequestStatus.DRAFT, LeaveRequestStatus.SUBMITTED];

function getDurationDays(startDate: string, endDate: string, holidayDateSet: Set<string>): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  const cursor = new Date(start);
  let duration = 0;
  while (cursor <= end) {
    const dayOfWeek = cursor.getDay();
    const dateString = cursor.toISOString().split('T')[0];
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDateSet.has(dateString)) {
      duration += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return duration;
}

export default function RequestsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebarLayout();
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<RequestFormData>(getEmptyForm());
  const itemsPerPage = 5;

  const canCreateLeaveRequest = Boolean(
    user?.permissions?.some((permission) => permission.action === 'CREATE' && permission.resource === 'LEAVE_REQUEST')
  );
  const isEmployee = user?.role === 'Employee';
  const canMutate = canCreateLeaveRequest;

  useEffect(() => {
    if (!formData.startDate) {
      setFormData((current) => ({
        ...current,
        startDate: getLocalTodayString(),
      }));
    }
  }, [formData.startDate]);

  const employeeLookupParams = useMemo(() => {
    const params = new URLSearchParams({
      skip: '0',
      take: '25',
    });
    if (user?.email) {
      params.set('search', user.email);
    }
    return params.toString();
  }, [user?.email]);

  const employeeLookupQuery = useQuery({
    queryKey: queryKeys.employees.list(employeeLookupParams),
    queryFn: () =>
      apiRequestRaw<EmployeeLookupResponse>(`/api/v1/employees?${employeeLookupParams}`, undefined, user?.id, user?.email),
    enabled: Boolean(canMutate && user?.email),
    staleTime: 2 * 60 * 1000,
  });

  const currentEmployeeId = useMemo(() => {
    if (!canMutate || !user?.email) return null;
    const userEmail = user.email.toLowerCase();
    return (
      employeeLookupQuery.data?.employees.find(
        (employee) => employee.user.email.toLowerCase() === userEmail
      )?.id ?? null
    );
  }, [canMutate, employeeLookupQuery.data?.employees, user?.email]);

  const holidaysQuery = useQuery({
    queryKey: ['holidays', 'active'],
    queryFn: () => apiRequestRaw<HolidayListResponse>('/api/v1/holidays', undefined, user?.id, user?.email),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });

  const holidayDateSet = useMemo(
    () => new Set((holidaysQuery.data?.data ?? []).filter((holiday) => holiday.active).map((holiday) => holiday.date.split('T')[0])),
    [holidaysQuery.data?.data]
  );

  const requestsParams = useMemo(() => {
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(itemsPerPage),
    });
    if (canMutate) {
      params.set('employeeId', currentEmployeeId ?? '__no_matching_employee__');
    }
    if (selectedStatus !== 'ALL') {
      params.set('status', selectedStatus);
    }
    return params.toString();
  }, [canMutate, currentEmployeeId, currentPage, itemsPerPage, selectedStatus]);

  const requestsSummaryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: '1',
      limit: '1',
      includeSummary: 'true',
    });
    if (canMutate) {
      params.set('employeeId', currentEmployeeId ?? '__no_matching_employee__');
    }
    return params.toString();
  }, [canMutate, currentEmployeeId]);

  const requestsQuery = useQuery({
    queryKey: queryKeys.requests.list(requestsParams),
    queryFn: () => apiRequestRaw<RequestsResponse>(`/api/v1/requests?${requestsParams}`, undefined, user?.id, user?.email),
    enabled: Boolean(user && (!canMutate || employeeLookupQuery.isSuccess)),
    placeholderData: keepPreviousData,
  });

  const requestsSummaryQuery = useQuery({
    queryKey: queryKeys.requests.summary(requestsSummaryParams),
    queryFn: () => apiRequestRaw<RequestsResponse>(`/api/v1/requests?${requestsSummaryParams}`, undefined, user?.id, user?.email),
    enabled: Boolean(user && (!canMutate || employeeLookupQuery.isSuccess)),
    staleTime: 30 * 1000,
  });

  const leaveTypesQuery = useQuery({
    queryKey: queryKeys.leaveTypes.list('active=true&skip=0&take=1000'),
    queryFn: () => apiRequestRaw<LeaveTypeListResponse>('/api/v1/leave-types?active=true&skip=0&take=1000', undefined, user?.id, user?.email),
    enabled: Boolean(user),
    staleTime: 10 * 60 * 1000,
  });

  const balancesQuery = useQuery({
    queryKey: ['balances', 'current', currentEmployeeId],
    queryFn: () => apiRequestRaw<any[]>(`/api/v1/balances?employeeId=${currentEmployeeId}`, undefined, user?.id, user?.email),
    enabled: !!currentEmployeeId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!requestsQuery.isError) return;
    const error = requestsQuery.error;
    showErrorToast(requestsQuery.error, 'Failed to load leave requests');
  }, [requestsQuery.error, requestsQuery.isError, toast]);

  const upsertRequestMutation = useMutation({
    mutationFn: async (payload: RequestFormData & { id?: string }) => {
      const durationDays = getDurationDays(payload.startDate, payload.endDate, holidayDateSet);

      if (payload.id) {
        await apiRequestRaw(`/api/v1/requests/${payload.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            reason: payload.reason,
            startDate: payload.startDate,
            endDate: payload.endDate,
            durationDays,
          }),
        }, user?.id, user?.email);
        return;
      }

      if (!currentEmployeeId) {
        throw new ApiError('Employee profile not found for current user.', 400);
      }

      const created = await apiRequestRaw<{ data: LeaveRequestRecord }>('/api/v1/requests', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: currentEmployeeId,
          leaveTypeId: payload.leaveTypeId,
          startDate: payload.startDate,
          endDate: payload.endDate,
          durationDays,
          reason: payload.reason,
        }),
      }, user?.id, user?.email);

      await apiRequestRaw(`/api/v1/requests/${created.data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: LeaveRequestStatus.SUBMITTED,
        }),
      }, user?.id, user?.email);
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      setIsEditMode(false);
      setSelectedRequest(null);
      setSubmitConfirmOpen(false);
      setFormData(getEmptyForm);
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.list(requestsParams) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.summary(requestsSummaryParams) });
      queryClient.invalidateQueries({ queryKey: ['requests', 'approvals'], refetchType: 'none' });
      toast({
        title: isEditMode ? 'Request Updated' : 'Request Submitted',
        description: isEditMode
          ? 'Your leave request has been updated successfully.'
          : 'Your leave request has been submitted for approval.',
      });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequestRaw(`/api/v1/requests/${id}`, {
        method: 'DELETE',
      }, user?.id, user?.email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.list(requestsParams) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.summary(requestsSummaryParams) });
      queryClient.invalidateQueries({ queryKey: ['requests', 'approvals'], refetchType: 'none' });
      setDeleteConfirmOpen(false);
      setRequestToDelete(null);
      toast({
        title: 'Request Cancelled',
        description: 'The leave request has been cancelled successfully.',
      });
    },
  });

  const requests = requestsQuery.data?.data ?? [];
  const requestSummary = requestsSummaryQuery.data?.summary;
  const totalRequestCount =
    (requestSummary?.[LeaveRequestStatus.DRAFT] ?? 0) +
    (requestSummary?.[LeaveRequestStatus.SUBMITTED] ?? 0) +
    (requestSummary?.[LeaveRequestStatus.APPROVED] ?? 0) +
    (requestSummary?.[LeaveRequestStatus.REJECTED] ?? 0) +
    (requestSummary?.[LeaveRequestStatus.CANCELLED] ?? 0);
  const totalPages = Math.max(1, requestsQuery.data?.pagination.pages ?? 1);
  const totalFilteredCount = requestsQuery.data?.pagination.total ?? 0;

  const canManageRequest = (request: LeaveRequestRecord) => {
    if (!canMutate) return false;
    return request.employeeId === currentEmployeeId;
  };

  const handleNewRequest = () => {
    if (!canMutate) return;
    if (!currentEmployeeId) {
      showErrorToast('No employee profile is linked to this account.', 'Unavailable');
      return;
    }

    setSelectedRequest(null);
    setIsEditMode(false);
    setFormData(getEmptyForm());
    setIsDialogOpen(true);
  };

  const handleEdit = (request: LeaveRequestRecord) => {
    setSelectedRequest(request);
    setIsEditMode(true);
    setFormData({
      leaveTypeId: request.leaveTypeId,
      startDate: request.startDate.split('T')[0],
      endDate: request.endDate.split('T')[0],
      reason: request.reason,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setRequestToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (cancelRequestMutation.isPending) return;
    if (!requestToDelete) return;
    try {
      await cancelRequestMutation.mutateAsync(requestToDelete);
    } catch (error) {
      showErrorToast(error, 'Failed to cancel request');
    }
  };

  const validateRequestForm = (): boolean => {
    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      showErrorToast('Leave type, start date, end date, and reason are required.', 'Validation Error');
      return false;
    }

    if (!isEditMode && !formData.leaveTypeId) {
      showErrorToast('Leave type is required.', 'Validation Error');
      return false;
    }

    const minStartDate = getLocalTodayString();
    if (formData.startDate < minStartDate) {
      showErrorToast('Start date cannot be in the past.', 'Validation Error');
      return false;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      showErrorToast('End date must be after or same as start date.', 'Validation Error');
      return false;
    }

    // Balance Validation
    const effectiveLeaveTypeId = isEditMode ? selectedRequest?.leaveTypeId : formData.leaveTypeId;
    const currentBalance = balancesQuery.data?.find((b: any) => b.leaveTypeId === effectiveLeaveTypeId)?.closingBalance ?? 0;
    const requestedDuration = getDurationDays(formData.startDate, formData.endDate, holidayDateSet);
    
    if (requestedDuration > currentBalance) {
      showErrorToast(`Insufficient leave balance. Available: ${currentBalance}, Requested: ${requestedDuration}`, 'Validation Error');
      return false;
    }

    return true;
  };

  const handleSaveRequest = async () => {
    if (!validateRequestForm()) return;
    try {
      await upsertRequestMutation.mutateAsync({
        id: selectedRequest?.id,
        leaveTypeId: formData.leaveTypeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
      });
    } catch (error) {
      showErrorToast(error, 'Failed to save request');
    }
  };

  const handlePrimaryAction = () => {
    if (isEditMode) {
      void handleSaveRequest();
      return;
    }

    if (!validateRequestForm()) return;
    setSubmitConfirmOpen(true);
  };

  const getStatusColor = (status: LeaveRequestStatus): BadgeVariant =>
    statusConfig[status]?.color ?? 'outline';

  const isLoading =
    requestsQuery.isLoading ||
    requestsSummaryQuery.isLoading ||
    (canMutate && employeeLookupQuery.isLoading);
  const leaveTypes = leaveTypesQuery.data?.leaveTypes ?? [];

  // Prevent hydration mismatch by only rendering once mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <MobileHeader />
        <Sidebar />
        <MainContent>
          <div className={cn("pt-4 pr-4 pb-4 pl-4 md:pt-8 md:pr-8 md:pb-8", isCollapsed ? "md:px-8" : "md:px-8", "max-w-8xl mx-auto")}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {isEmployee ? 'My Leave Requests' : 'Leave Requests'}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {isEmployee ? 'Manage your leave requests and track their status' : 'Review and manage all employee leave requests'}
                </p>
              </div>
              <Button onClick={handleNewRequest} className="gap-2" disabled={!canMutate}>
                <Plus className="w-4 h-4" />
                New Request
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground">{totalRequestCount}</div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Submitted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground">
                    {requestSummary?.[LeaveRequestStatus.SUBMITTED] ?? 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Approved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground">
                    {requestSummary?.[LeaveRequestStatus.APPROVED] ?? 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Drafts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground">
                    {requestSummary?.[LeaveRequestStatus.DRAFT] ?? 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5">
                    <CardTitle>{isEmployee ? 'My Leave Requests' : 'Leave Requests'}</CardTitle>
                    <CardDescription>
                      {isEmployee ? 'View and manage your personal leave requests.' : 'View the system-wide directory of all submitted leave requests.'}
                    </CardDescription>
                  </div>
                  <div className="w-full md:w-auto">
                    <Select
                      value={selectedStatus}
                      onValueChange={(value) => {
                        setSelectedStatus(value as StatusFilter);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full md:w-48 bg-muted border-input flex-shrink-0">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Requests</SelectItem>
                        <SelectItem value={LeaveRequestStatus.DRAFT}>Draft</SelectItem>
                        <SelectItem value={LeaveRequestStatus.SUBMITTED}>Submitted</SelectItem>
                        <SelectItem value={LeaveRequestStatus.APPROVED}>Approved</SelectItem>
                        <SelectItem value={LeaveRequestStatus.REJECTED}>Rejected</SelectItem>
                        <SelectItem value={LeaveRequestStatus.CANCELLED}>Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="py-4">
                    <SkeletonTable rows={itemsPerPage} columns={isEmployee ? 8 : 7} />
                  </div>
                ) : (
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Leave Type</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Approved By</TableHead>
                          {isEmployee && (
                            <TableHead className="text-right">Actions</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={isEmployee ? 8 : 7} className="text-center text-muted-foreground py-8">
                              No requests found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          requests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium text-foreground">
                                {request.employee.user.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{request.leaveType.name}</TableCell>
                              <TableCell className="text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(request.startDate).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(request.endDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{request.durationDays}d</TableCell>
                              <TableCell>
                                <Badge variant={getStatusColor(request.status)}>{request.status}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {request.approver?.name ?? '-'}
                              </TableCell>
                              {/* Only show Actions cell if user is an employee */}
                              {isEmployee && (
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {canManageRequest(request) &&
                                      editableStatuses.includes(request.status) && (
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(request)}>
                                          Edit
                                        </Button>
                                      )}
                                    {canManageRequest(request) &&
                                      editableStatuses.includes(request.status) && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDelete(request.id)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-10"
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </MainContent>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{isEditMode ? 'Edit Leave Request' : 'New Leave Request'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Modify your existing leave request details below.' : 'Submit a new leave request for approval. Please ensure you have sufficient balance.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-1 gap-8">
              {/* Left Column: Configuration */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Leave Type</label>
                  <Select
                    value={formData.leaveTypeId}
                    onValueChange={(value) => setFormData({ ...formData, leaveTypeId: value })}
                    disabled={isEditMode}
                  >
                    <SelectTrigger className="w-full bg-muted/50 border-border/50 h-11 focus:bg-background transition-all">
                      <SelectValue placeholder="Select a leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Real-time Balance Display */}
                  {formData.leaveTypeId && (
                    <div className="mt-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 transition-all animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Available Balance</p>
                          <p className="text-xl font-bold text-primary mt-0.5">
                            {balancesQuery.isLoading ? (
                              <span className="inline-block w-12 h-6 animate-pulse bg-primary/10 rounded" />
                            ) : (
                              `${balancesQuery.data?.find((b: any) => b.leaveTypeId === formData.leaveTypeId)?.closingBalance ?? 0} days`
                            )}
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-white shadow-sm border border-primary/10">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Requested Period</label>
                  <div className="relative">
                    <DatePickerWithRange
                      date={{
                        from: formData.startDate ? new Date(formData.startDate) : undefined,
                        to: formData.endDate ? new Date(formData.endDate) : undefined,
                      }}
                      setDate={(range) => {
                        const toLocalDateString = (d: Date) => {
                          const offset = d.getTimezoneOffset();
                          const adjustedDate = new Date(d.getTime() - (offset * 60 * 1000));
                          return adjustedDate.toISOString().split('T')[0];
                        };
                        setFormData({
                          ...formData,
                          startDate: range?.from ? toLocalDateString(range.from) : '',
                          endDate: range?.to ? toLocalDateString(range.to) : '',
                        });
                      }}
                      minDate={getLocalTodayDate()}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3 px-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs italic">Weekends & holidays excluded</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Total Duration:</span>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "px-3 py-0.5 rounded-lg font-bold transition-all",
                          getDurationDays(formData.startDate, formData.endDate, holidayDateSet) > (balancesQuery.data?.find((b: any) => b.leaveTypeId === (isEditMode ? selectedRequest?.leaveTypeId : formData.leaveTypeId))?.closingBalance ?? 0)
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : "text-primary bg-primary/10 border-none"
                        )}
                      >
                        {getDurationDays(formData.startDate, formData.endDate, holidayDateSet)} days
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Insufficient Balance Alert */}
                  {formData.startDate && formData.endDate && formData.leaveTypeId && 
                    getDurationDays(formData.startDate, formData.endDate, holidayDateSet) > (balancesQuery.data?.find((b: any) => b.leaveTypeId === (isEditMode ? selectedRequest?.leaveTypeId : formData.leaveTypeId))?.closingBalance ?? 0) && (
                    <div className="mt-4 p-4 rounded-2xl bg-destructive/5 border border-destructive/10 flex gap-3 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-destructive">Insufficient Balance</p>
                        <p className="text-xs text-destructive/80 mt-1 leading-relaxed">
                          This request exceeds your available balance for this leave type. Please adjust the dates or choose a different leave type.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Reason & Context */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-semibold text-foreground">Reason for Absence</label>
                <div className="flex-1 min-h-[200px] rounded-2xl border border-border/50 bg-muted/50 focus-within:bg-background focus-within:border-primary/30 transition-all p-4 group">
                  <textarea
                    placeholder="Provide details about your leave request (e.g., family emergency, medical checkup, etc.)..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full h-full bg-transparent border-0 outline-0 resize-none text-sm text-foreground placeholder:text-muted-foreground/60 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setIsEditMode(false);
                setSubmitConfirmOpen(false);
                setSelectedRequest(null);
                setFormData(getEmptyForm());
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePrimaryAction} disabled={upsertRequestMutation.isPending}>
              {isEditMode ? 'Update' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this leave request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={cancelRequestMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this leave request? This action will notify your manager.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveRequest}
              disabled={upsertRequestMutation.isPending}
            >
              Submit Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
