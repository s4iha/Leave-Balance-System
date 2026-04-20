'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { toast } from '@/lib/sonner-toast';
import { ApiError, apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { LeaveRequestStatus } from '@/generated/prisma/enums';

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

const emptyForm: RequestFormData = {
  leaveTypeId: '',
  startDate: '',
  endDate: '',
  reason: '',
};
const editableStatuses: LeaveRequestStatus[] = [LeaveRequestStatus.DRAFT, LeaveRequestStatus.SUBMITTED];

function getDurationDays(startDate: string, endDate: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerDay));
}

export default function RequestsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<RequestFormData>(emptyForm);
  const itemsPerPage = 5;

  const isEmployee = user?.role === 'EMPLOYEE';
  const canMutate = Boolean(isEmployee);

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
      apiRequestRaw<EmployeeLookupResponse>(`/api/v1/employees?${employeeLookupParams}`),
    enabled: Boolean(isEmployee && user?.email),
  });

  const currentEmployeeId = useMemo(() => {
    if (!isEmployee || !user?.email) return null;
    const userEmail = user.email.toLowerCase();
    return (
      employeeLookupQuery.data?.employees.find(
        (employee) => employee.user.email.toLowerCase() === userEmail
      )?.id ?? null
    );
  }, [employeeLookupQuery.data?.employees, isEmployee, user?.email]);

  const requestsParams = useMemo(() => {
    const params = new URLSearchParams({
      page: '1',
      limit: '1000',
    });
    if (isEmployee) {
      params.set('employeeId', currentEmployeeId ?? '__no_matching_employee__');
    }
    return params.toString();
  }, [currentEmployeeId, isEmployee]);

  const requestsQuery = useQuery({
    queryKey: queryKeys.requests.list(requestsParams),
    queryFn: () => apiRequestRaw<RequestsResponse>(`/api/v1/requests?${requestsParams}`),
    enabled: Boolean(user && (!isEmployee || employeeLookupQuery.isSuccess)),
  });

  const leaveTypesQuery = useQuery({
    queryKey: queryKeys.leaveTypes.list('active=true&skip=0&take=1000'),
    queryFn: () => apiRequestRaw<LeaveTypeListResponse>('/api/v1/leave-types?active=true&skip=0&take=1000'),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!requestsQuery.isError) return;
    const error = requestsQuery.error;
    toast({
      title: 'Error',
      description: error instanceof ApiError ? error.message : 'Failed to load leave requests.',
      variant: 'destructive',
    });
  }, [requestsQuery.error, requestsQuery.isError, toast]);

  const upsertRequestMutation = useMutation({
    mutationFn: async (payload: RequestFormData & { id?: string }) => {
      const durationDays = getDurationDays(payload.startDate, payload.endDate);

      if (payload.id) {
        await apiRequestRaw(`/api/v1/requests/${payload.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            reason: payload.reason,
            startDate: payload.startDate,
            endDate: payload.endDate,
            durationDays,
          }),
        });
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
      });

      await apiRequestRaw(`/api/v1/requests/${created.data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: LeaveRequestStatus.SUBMITTED,
        }),
      });
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      setIsEditMode(false);
      setSelectedRequest(null);
      setSubmitConfirmOpen(false);
      setFormData(emptyForm);
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.list(requestsParams) });
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
      }),
    onSuccess: (_, deletedRequestId) => {
      queryClient.setQueryData<RequestsResponse>(queryKeys.requests.list(requestsParams), (previous) => ({
        data: (previous?.data ?? []).filter((request) => request.id !== deletedRequestId),
      }));
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
  const filteredRequests = requests.filter((request) =>
    selectedStatus === 'ALL' ? true : request.status === selectedStatus
  );

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const canManageRequest = (request: LeaveRequestRecord) => {
    if (!canMutate) return false;
    if (currentEmployeeId) return request.employeeId === currentEmployeeId;
    return request.employee.user.email.toLowerCase() === (user?.email ?? '').toLowerCase();
  };

  const handleNewRequest = () => {
    if (!canMutate) return;
    if (!currentEmployeeId) {
      toast({
        title: 'Unavailable',
        description: 'No employee profile is linked to this account.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedRequest(null);
    setIsEditMode(false);
    setFormData(emptyForm);
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
    if (!requestToDelete) return;
    try {
      await cancelRequestMutation.mutateAsync(requestToDelete);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof ApiError ? error.message : 'Failed to cancel request.',
        variant: 'destructive',
      });
    }
  };

  const validateRequestForm = (): boolean => {
    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Leave type, start date, end date, and reason are required.',
        variant: 'destructive',
      });
      return false;
    }

    if (!isEditMode && !formData.leaveTypeId) {
      toast({
        title: 'Validation Error',
        description: 'Leave type is required.',
        variant: 'destructive',
      });
      return false;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      toast({
        title: 'Validation Error',
        description: 'End date must be after start date.',
        variant: 'destructive',
      });
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
      toast({
        title: 'Error',
        description: error instanceof ApiError ? error.message : 'Failed to save request.',
        variant: 'destructive',
      });
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

  const isLoading = requestsQuery.isLoading || (isEmployee && employeeLookupQuery.isLoading);
  const leaveTypes = leaveTypesQuery.data?.leaveTypes ?? [];

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Leave Requests</h1>
                <p className="text-muted-foreground mt-2">Manage your leave requests and approvals</p>
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
                  <div className="text-2xl font-bold text-foreground">{requests.length}</div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Submitted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {requests.filter((r) => r.status === LeaveRequestStatus.SUBMITTED).length}
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
                  <div className="text-2xl font-bold text-foreground">
                    {requests.filter((r) => r.status === LeaveRequestStatus.APPROVED).length}
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
                  <div className="text-2xl font-bold text-foreground">
                    {requests.filter((r) => r.status === LeaveRequestStatus.DRAFT).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Leave Requests</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
                </p>
              </div>
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

            <Card className="border-border">
              <CardContent>
                {isLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading requests...</div>
                ) : (
                  <div className="overflow-x-auto">
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
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No requests found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedRequests.map((request) => (
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
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
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
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Leave Request' : 'New Leave Request'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update your leave request' : 'Submit a new leave request'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Leave Type</label>
              <Select
                value={formData.leaveTypeId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, leaveTypeId: value }))}
                disabled={isEditMode}
              >
                <SelectTrigger className="bg-muted border-input">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((leaveType) => (
                    <SelectItem key={leaveType.id} value={leaveType.id}>
                      {leaveType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Start Date</label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: event.target.value,
                  }))
                }
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">End Date</label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    endDate: event.target.value,
                  }))
                }
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Reason</label>
              <Input
                placeholder="Reason for leave"
                value={formData.reason}
                onChange={(event) => setFormData((prev) => ({ ...prev, reason: event.target.value }))}
                className="bg-muted border-input"
              />
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
                setFormData(emptyForm);
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={submitConfirmOpen}
        onOpenChange={(open) => {
          setSubmitConfirmOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this leave request for approval?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSubmitConfirmOpen(false);
                void handleSaveRequest();
              }}
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
