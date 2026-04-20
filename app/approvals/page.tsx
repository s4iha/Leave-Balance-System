'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { AlertCircle, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { toast } from '@/lib/sonner-toast';
import { ApiError, apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { LeaveRequestStatus } from '@/generated/prisma/enums';

interface LeaveRequestRecord {
  id: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  createdAt: string;
  approvalDate: string | null;
  approvalNotes: string | null;
  status: LeaveRequestStatus;
  employee: {
    user: {
      name: string;
      email: string;
    };
  };
  leaveType: {
    name: string;
  };
}

interface RequestsResponse {
  data: LeaveRequestRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestRecord | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const itemsPerPage = 3;
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const pendingParams = useMemo(() => {
    const params = new URLSearchParams({
      status: LeaveRequestStatus.SUBMITTED,
      page: String(pendingPage),
      limit: String(itemsPerPage),
    });
    return params.toString();
  }, [itemsPerPage, pendingPage]);

  const approvedParams = useMemo(() => {
    const params = new URLSearchParams({
      status: LeaveRequestStatus.APPROVED,
      page: String(approvedPage),
      limit: String(itemsPerPage),
    });
    return params.toString();
  }, [approvedPage, itemsPerPage]);

  const pendingRequestsQuery = useQuery({
    queryKey: queryKeys.requests.approvals(pendingParams),
    queryFn: () => apiRequestRaw<RequestsResponse>(`/api/v1/requests?${pendingParams}`),
    enabled: activeTab === 'pending',
    placeholderData: keepPreviousData,
  });

  const approvedRequestsQuery = useQuery({
    queryKey: queryKeys.requests.approvals(approvedParams),
    queryFn: () => apiRequestRaw<RequestsResponse>(`/api/v1/requests?${approvedParams}`),
    enabled: activeTab === 'approved',
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!pendingRequestsQuery.isError && !approvedRequestsQuery.isError) return;
    const error = pendingRequestsQuery.error ?? approvedRequestsQuery.error;
    toast({
      title: 'Error',
      description: error instanceof ApiError ? error.message : 'Failed to load approvals.',
      variant: 'destructive',
    });
  }, [
    approvedRequestsQuery.error,
    approvedRequestsQuery.isError,
    pendingRequestsQuery.error,
    pendingRequestsQuery.isError,
    toast,
  ]);

  const approvalMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      status: 'APPROVED' | 'REJECTED';
      approvalNotes: string | null;
    }) =>
      apiRequestRaw(`/api/v1/requests/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: payload.status,
          approvalNotes: payload.approvalNotes,
        }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.approvals(pendingParams) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.approvals(approvedParams) });
      queryClient.invalidateQueries({ queryKey: ['requests', 'list'], refetchType: 'none' });
      toast({
        title: variables.status === LeaveRequestStatus.APPROVED ? 'Request Approved' : 'Request Rejected',
        description: `${selectedRequest?.employee.user.name ?? 'Employee'}'s leave request has been ${
          variables.status === LeaveRequestStatus.APPROVED ? 'approved' : 'rejected'
        }.`,
      });
      setConfirmDialogOpen(false);
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      setConfirmAction(null);
    },
  });

  const pendingRequests = pendingRequestsQuery.data?.data ?? [];
  const approvedRequests = approvedRequestsQuery.data?.data ?? [];
  const pendingTotalCount = pendingRequestsQuery.data?.pagination.total ?? 0;
  const approvedTotalCount = approvedRequestsQuery.data?.pagination.total ?? 0;
  const pendingTotalPages = Math.max(1, pendingRequestsQuery.data?.pagination.pages ?? 1);
  const approvedTotalPages = Math.max(1, approvedRequestsQuery.data?.pagination.pages ?? 1);

  const handleApprove = (request: LeaveRequestRecord) => {
    setSelectedRequest(request);
    setApprovalNotes(request.approvalNotes ?? '');
    setConfirmAction('approve');
    setIsDialogOpen(true);
  };

  const handleReject = (request: LeaveRequestRecord) => {
    setSelectedRequest(request);
    setApprovalNotes(request.approvalNotes ?? '');
    setConfirmAction('reject');
    setIsDialogOpen(true);
  };

  const confirmApprovalAction = async () => {
    if (!selectedRequest || !confirmAction) return;
    try {
      await approvalMutation.mutateAsync({
        id: selectedRequest.id,
        status:
          confirmAction === 'approve'
            ? LeaveRequestStatus.APPROVED
            : LeaveRequestStatus.REJECTED,
        approvalNotes: approvalNotes.trim() || null,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof ApiError ? error.message : 'Failed to update request status.',
        variant: 'destructive',
      });
    }
  };

  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Approvals</h1>
              <p className="text-muted-foreground mt-2">Review and approve leave requests from your team</p>
            </div>

            {/* Alert for pending approvals */}
            {pendingTotalCount > 0 && (
              <Card className="mb-4 border-accent/20 bg-accent/5">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Pending Approvals</h3>
                      <p className="text-sm text-muted-foreground">
                        You have {pendingTotalCount} leave request{pendingTotalCount !== 1 ? 's' : ''} waiting for your approval.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <div className="mb-6 border-b border-border">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setActiveTab('pending');
                    setPendingPage(1);
                  }}
                  className={`px-4 py-2 border-b-2 transition-colors font-medium ${activeTab === 'pending'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Pending Requests ({pendingTotalCount})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('approved');
                    setApprovedPage(1);
                  }}
                  className={`px-4 py-2 border-b-2 transition-colors font-medium ${activeTab === 'approved'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Approved Requests ({approvedTotalCount})
                </button>
              </div>
            </div>

            {activeTab === 'pending' && (
              <div className="space-y-4">
                {pendingRequestsQuery.isLoading ? (
                  <Card className="border-border">
                    <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                      Loading pending approvals...
                    </CardContent>
                  </Card>
                ) : pendingRequests.length === 0 ? (
                  <Card className="border-border">
                    <CardContent className="pt-8 pb-8 text-center">
                      <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No Pending Approvals</h3>
                      <p className="text-muted-foreground">All leave requests have been reviewed.</p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingRequests.map((request) => (
                    <Card key={request.id} className="border-border hover:border-accent/50 transition-colors">
                      <CardContent className="pt-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-foreground">{request.employee.user.name}</h3>
                          <p className="text-sm text-muted-foreground">{request.employee.user.email}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase">Leave Type</p>
                            <Badge variant="outline">{request.leaveType.name}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase">Duration</p>
                            <p className="font-medium text-foreground">{request.durationDays} days</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase">Submitted</p>
                            <p className="text-sm text-foreground">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg border border-border mb-4">
                          <p className="text-xs text-muted-foreground uppercase mb-1">Reason</p>
                          <p className="text-sm text-foreground">{request.reason}</p>
                        </div>
                        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(request.startDate).toLocaleDateString()} to{' '}
                          {new Date(request.endDate).toLocaleDateString()}
                        </div>
                        <div className="border-t border-border pt-4 flex gap-2 justify-end">
                          <Button
                            onClick={() => handleReject(request)}
                            className="gap-2"
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleApprove(request)}
                            className="gap-2"
                            variant="default"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                {/* Pagination */}
                {pendingTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingPage(prev => Math.max(1, prev - 1))}
                      disabled={pendingPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: pendingTotalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={pendingPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPendingPage(page)}
                        className="min-w-10"
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingPage(prev => Math.min(pendingTotalPages, prev + 1))}
                      disabled={pendingPage === pendingTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approved' && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Approved Requests</CardTitle>
                  <CardDescription>Leave requests you have approved</CardDescription>
                </CardHeader>
                <CardContent>
                  {approvedRequestsQuery.isLoading ? (
                    <div className="py-6 text-center text-muted-foreground">Loading approved requests...</div>
                  ) : (
                    <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Leave Type</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>Approval Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No approved requests found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          approvedRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium text-foreground">
                                {request.employee.user.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{request.leaveType.name}</TableCell>
                              <TableCell className="text-muted-foreground">{request.durationDays} days</TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(request.startDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {request.approvalDate ? new Date(request.approvalDate).toLocaleDateString() : '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    </div>
                  )}
                  {approvedTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setApprovedPage((prev) => Math.max(1, prev - 1))}
                        disabled={approvedPage === 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: approvedTotalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={approvedPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setApprovedPage(page)}
                          className="min-w-10"
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setApprovedPage((prev) => Math.min(approvedTotalPages, prev + 1))}
                        disabled={approvedPage === approvedTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Approval Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
            <DialogDescription>
              Review and provide approval or rejection for{' '}
              {selectedRequest?.employee.user.name}&apos;s {selectedRequest?.leaveType.name} request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Duration</p>
                  <p className="font-medium text-foreground">{selectedRequest?.durationDays} days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Submitted</p>
                  <p className="font-medium text-foreground">
                    {selectedRequest ? new Date(selectedRequest.createdAt).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Approval Notes</label>
              <Textarea
                placeholder="Add any comments or notes for this approval/rejection"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="bg-muted border-input min-h-24"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmAction('reject');
                setConfirmDialogOpen(true);
              }}
              disabled={approvalMutation.isPending}
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
            <Button
              onClick={() => {
                setConfirmAction('approve');
                setConfirmDialogOpen(true);
              }}
              disabled={approvalMutation.isPending}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'approve' ? 'Approve Request' : 'Reject Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmAction} this leave request from {selectedRequest?.employee.user.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprovalAction}
              disabled={approvalMutation.isPending}
              className={confirmAction === 'approve' ? 'bg-primary' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
            >
              {confirmAction === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
