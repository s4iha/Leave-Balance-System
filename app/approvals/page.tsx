'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DateFormatter } from '@/components/date-formatter';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { MainContent } from '@/components/layout/main-content';
import { MobileHeader } from '@/components/layout/mobile-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard, SkeletonTable } from '@/components/ui/skeleton';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { AlertCircle, CheckCircle2, XCircle, Calendar, Timer, Clock, Mail, FileText, User, Briefcase, Filter, Search, ChevronRight } from 'lucide-react';
import { toast, showErrorToast } from '@/lib/sonner-toast';
import { ApiError, apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { LeaveRequestStatus } from '@/generated/prisma/enums';
import { useSidebarLayout } from '@/components/layout/sidebar-context';
import { KanbanBoard } from '@/components/approvals/kanban-board';
import { cn } from '@/lib/utils';

interface LeaveRequestRecord {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  createdAt: string;
  approvalDate: string | null;
  approvalNotes: string | null;
  status: LeaveRequestStatus;
  employee: {
    id: string;
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { isCollapsed } = useSidebarLayout();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestRecord | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeaveRequestStatus | 'ALL'>(LeaveRequestStatus.SUBMITTED);
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [listPage, setListPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);
  const itemsPerPage = 10;
  const pipelineItemsPerPage = 10; // More for pipeline
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<LeaveRequestRecord | null>(null);

  const listParams = useMemo(() => {
    const params = new URLSearchParams({
      page: String(listPage),
      limit: String(itemsPerPage),
    });
    if (statusFilter !== 'ALL') {
      params.append('status', statusFilter);
    }
    return params.toString();
  }, [listPage, statusFilter, itemsPerPage]);

  const pendingParams = useMemo(() => {
    const params = new URLSearchParams({
      status: LeaveRequestStatus.SUBMITTED,
      page: String(pendingPage),
      limit: String(pipelineItemsPerPage),
    });
    return params.toString();
  }, [pipelineItemsPerPage, pendingPage]);

  const approvedParams = useMemo(() => {
    const params = new URLSearchParams({
      status: LeaveRequestStatus.APPROVED,
      page: String(approvedPage),
      limit: String(pipelineItemsPerPage),
    });
    return params.toString();
  }, [approvedPage, pipelineItemsPerPage]);

  const rejectedParams = useMemo(() => {
    const params = new URLSearchParams({
      status: LeaveRequestStatus.REJECTED,
      page: String(rejectedPage),
      limit: String(pipelineItemsPerPage),
    });
    return params.toString();
  }, [pipelineItemsPerPage, rejectedPage]);

  const listRequestsQuery = useQuery({
    queryKey: queryKeys.requests.approvals(listParams),
    queryFn: () => apiRequestRaw<RequestsResponse>(`/api/v1/requests?${listParams}`, undefined, user?.id, user?.email),
    enabled: viewMode === 'list',
    placeholderData: keepPreviousData,
  });

  const pendingRequestsQuery = useQuery({
    queryKey: queryKeys.requests.approvals(pendingParams),
    queryFn: () => apiRequestRaw<RequestsResponse>(`/api/v1/requests?${pendingParams}`, undefined, user?.id, user?.email),
    enabled: viewMode === 'pipeline',
    placeholderData: keepPreviousData,
  });

  const approvedRequestsQuery = useQuery({
    queryKey: queryKeys.requests.approvals(approvedParams),
    queryFn: () => apiRequestRaw<RequestsResponse>(`/api/v1/requests?${approvedParams}`, undefined, user?.id, user?.email),
    enabled: viewMode === 'pipeline',
    placeholderData: keepPreviousData,
  });

  const rejectedRequestsQuery = useQuery({
    queryKey: queryKeys.requests.approvals(rejectedParams),
    queryFn: () => apiRequestRaw<RequestsResponse>(`/api/v1/requests?${rejectedParams}`, undefined, user?.id, user?.email),
    enabled: viewMode === 'pipeline',
    placeholderData: keepPreviousData,
  });

  const balancesQuery = useQuery({
    queryKey: ['balances', selectedRequest?.employeeId],
    queryFn: () => apiRequestRaw<any[]>(`/api/v1/balances?employeeId=${selectedRequest?.employeeId}`, undefined, user?.id, user?.email),
    enabled: !!selectedRequest?.employeeId && isDialogOpen,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!pendingRequestsQuery.isError && !approvedRequestsQuery.isError && !rejectedRequestsQuery.isError) return;
    const error = pendingRequestsQuery.error ?? approvedRequestsQuery.error ?? rejectedRequestsQuery.error;
    showErrorToast(error, 'Failed to load approvals');
  }, [
    approvedRequestsQuery.error,
    approvedRequestsQuery.isError,
    rejectedRequestsQuery.error,
    rejectedRequestsQuery.isError,
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
      }, user?.id, user?.email),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.approvals(listParams) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.approvals(pendingParams) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.approvals(approvedParams) });
      queryClient.invalidateQueries({ queryKey: ['requests', 'list'], refetchType: 'none' });
      toast({
        title: variables.status === LeaveRequestStatus.APPROVED ? 'Request Approved' : 'Request Rejected',
        description: `${selectedRequest?.employee.user.name ?? 'Employee'}'s leave request has been ${variables.status === LeaveRequestStatus.APPROVED ? 'approved' : 'rejected'
          }.`,
      });
      setConfirmDialogOpen(false);
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      setConfirmAction(null);
    },
  });

  const listRequests = listRequestsQuery.data?.data ?? [];
  const pendingRequests = pendingRequestsQuery.data?.data ?? [];
  const approvedRequests = approvedRequestsQuery.data?.data ?? [];
  const rejectedRequests = rejectedRequestsQuery.data?.data ?? [];

  const listTotalPages = Math.max(1, listRequestsQuery.data?.pagination.pages ?? 1);
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

  const openRequestDetails = (request: LeaveRequestRecord) => {
    setDetailRequest(request);
    setIsDetailSheetOpen(true);
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
      showErrorToast(error, 'Failed to update request status');
    }
  };

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
    <ProtectedRoute requiredPermissions={[{ action: 'APPROVE', resource: 'LEAVE_REQUEST' }]}>
      <div className="flex h-screen bg-background">
        <MobileHeader />
        <Sidebar />
        <MainContent>
          <div className={cn("pt-4 pr-4 pb-4 pl-4 md:pt-8 md:pr-8 md:pb-8", isCollapsed ? "md:px-8" : "md:px-8", "max-w-8xl mx-auto")}>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Approvals</h1>
              <p className="text-muted-foreground mt-2">Review and approve leave requests from your team</p>
            </div>

            {/* Header Content is now managed within the Card below for consistency */}

            <Card className="border-border">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">Request Directory</CardTitle>
                      <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
                        <Button
                          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                          size="sm"
                          className={cn("h-7 px-3 text-xs font-medium", viewMode === 'list' && "bg-background shadow-sm")}
                          onClick={() => setViewMode('list')}
                        >
                          List
                        </Button>
                        <Button
                          variant={viewMode === 'pipeline' ? 'secondary' : 'ghost'}
                          size="sm"
                          className={cn("h-7 px-3 text-xs font-medium", viewMode === 'pipeline' && "bg-background shadow-sm")}
                          onClick={() => setViewMode('pipeline')}
                        >
                          Pipeline
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Review and manage leave requests from your assigned team members.
                    </CardDescription>
                  </div>

                  {viewMode === 'list' && (
                    <div className="flex flex-wrap gap-1.5 p-1 bg-muted/30 rounded-lg border border-border/50">
                      {[
                        { label: 'Pending', value: LeaveRequestStatus.SUBMITTED },
                        { label: 'Approved', value: LeaveRequestStatus.APPROVED },
                        { label: 'Rejected', value: LeaveRequestStatus.REJECTED },
                        { label: 'All', value: 'ALL' }
                      ].map((filter) => (
                        <Button
                          key={filter.value}
                          variant={statusFilter === filter.value ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => {
                            setStatusFilter(filter.value as LeaveRequestStatus | 'ALL');
                            setListPage(1);
                          }}
                          className={cn(
                            "h-8 px-4 text-xs font-medium transition-all",
                            statusFilter === filter.value && "bg-background shadow-sm text-primary"
                          )}
                        >
                          {filter.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'list' ? (
                  <>
                    {listRequestsQuery.isLoading ? (
                      <div className="py-4">
                        <SkeletonTable rows={10} columns={6} />
                      </div>
                    ) : listRequests.length === 0 ? (
                      <div className="py-20 text-center">
                        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-semibold text-foreground mb-1">No requests found</h3>
                        <p className="text-muted-foreground">Try adjusting your filters or status selection.</p>
                      </div>
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
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                        <TableBody>
                          {listRequests.map((request) => (
                            <TableRow
                              key={request.id}
                              className="cursor-pointer transition-colors"
                              onClick={() => openRequestDetails(request)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-foreground">
                                    {request.employee.user.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{request.employee.user.email}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-medium bg-background">
                                  {request.leaveType.name}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                <DateFormatter date={request.startDate} format="MMM d, yyyy" />
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                <DateFormatter date={request.endDate} format="MMM d, yyyy" />
                              </TableCell>
                              <TableCell>
                                <span className="font-medium text-foreground">{request.durationDays}d</span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    "font-bold uppercase text-[10px] tracking-wider",
                                    request.status === 'APPROVED' && "bg-green-500/10 text-green-600 border-green-500/20",
                                    request.status === 'REJECTED' && "bg-red-500/10 text-red-600 border-red-500/20",
                                    request.status === 'SUBMITTED' && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                                    request.status === 'CANCELLED' && "bg-slate-500/10 text-slate-600 border-slate-500/20"
                                  )}
                                  variant="outline"
                                >
                                  {request.status === 'SUBMITTED' ? 'Pending' : request.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Unified Pagination */}
                  {listTotalPages > 1 && (
                    <div className="p-4 border-t border-border">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (listPage > 1) setListPage(listPage - 1);
                              }}
                              className={listPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          {Array.from({ length: listTotalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                isActive={listPage === page}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setListPage(page);
                                }}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (listPage < listTotalPages) setListPage(listPage + 1);
                              }}
                              className={listPage === listTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <KanbanBoard
                    requests={[...pendingRequests, ...approvedRequests, ...rejectedRequests]}
                    onSelectRequest={openRequestDetails}
                    isLoading={pendingRequestsQuery.isLoading || approvedRequestsQuery.isLoading || rejectedRequestsQuery.isLoading}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </MainContent>
      </div>

      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl p-0 overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Request Details</SheetTitle>
            <SheetDescription>Detailed view of the leave request</SheetDescription>
          </SheetHeader>
          {detailRequest && (
            <div className="flex flex-col h-full">
              {/* Premium Header with Background Accent */}
              <div className="relative h-32 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
                <div className="absolute -bottom-8 left-8">
                  <div className="w-20 h-20 rounded-2xl bg-background border-4 border-background shadow-lg flex items-center justify-center text-primary overflow-hidden">
                    <User className="w-10 h-10" />
                  </div>
                </div>
              </div>

              <div className="pt-12 px-8 pb-8 flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Employee Identity */}
                <div className="space-y-1">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {detailRequest.status}
                  </Badge>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {detailRequest.employee.user.name}
                  </h2>
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Mail className="w-3.5 h-3.5" />
                    {detailRequest.employee.user.email}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/50">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      Timeline
                    </div>
                    <div className="text-sm font-medium">
                      <DateFormatter date={detailRequest.startDate} format="MMM d, yyyy" />
                      <span className="mx-2 text-muted-foreground">→</span>
                      <DateFormatter date={detailRequest.endDate} format="MMM d, yyyy" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Briefcase className="w-3.5 h-3.5" />
                      Leave Type
                    </div>
                    <p className="text-sm font-medium">{detailRequest.leaveType.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Timer className="w-3.5 h-3.5" />
                      Duration
                    </div>
                    <p className="text-sm font-medium">{detailRequest.durationDays} Full Days</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5" />
                      Submission
                    </div>
                    <p className="text-sm font-medium">
                      <DateFormatter date={detailRequest.createdAt} format="MMM d, yyyy" />
                    </p>
                  </div>
                </div>

                {/* Styled Reason Block */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason for Request</div>
                  <div className="relative p-5 rounded-2xl bg-muted/30 border border-border/50 italic text-foreground/80 leading-relaxed shadow-inner">
                    <div className="absolute top-2 left-2 text-primary/20 select-none">
                      <FileText className="w-8 h-8 rotate-12" />
                    </div>
                    <p className="relative z-10 pl-6">"{detailRequest.reason}"</p>
                  </div>
                </div>

                {/* Status Specific Info */}
                {detailRequest.status === 'APPROVED' && detailRequest.approvalDate && (
                  <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-green-600 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      Approval Record
                    </div>
                    <p className="text-sm text-green-700/80">
                      Approved on <DateFormatter date={detailRequest.approvalDate} format="MMM d, yyyy" />
                    </p>
                    {detailRequest.approvalNotes && (
                      <p className="text-xs text-green-600 italic mt-1 border-l-2 border-green-200 pl-3">
                        "{detailRequest.approvalNotes}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              {detailRequest.status === LeaveRequestStatus.SUBMITTED && (
                <div className="p-6 border-t border-border/50 bg-background flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                    onClick={() => handleReject(detailRequest)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline Request
                  </Button>
                  <Button
                    className="flex-1 h-11 shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]"
                    onClick={() => handleApprove(detailRequest)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve Leave
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

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
          <div className="space-y-6 py-4">
            <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Duration</p>
                  <p className="font-bold text-foreground">{selectedRequest?.durationDays} days</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Submitted</p>
                  <p className="font-medium text-foreground">
                    {selectedRequest ? <DateFormatter date={selectedRequest.createdAt} format="MMM d, yyyy" /> : '-'}
                  </p>
                </div>
              </div>

              {/* Balance Info for Manager */}
              <div className="pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Available Balance</p>
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "text-lg font-bold",
                    (balancesQuery.data?.find((b: any) => b.leaveTypeId === selectedRequest?.leaveTypeId)?.closingBalance ?? 0) < (selectedRequest?.durationDays ?? 0)
                      ? "text-destructive"
                      : "text-primary"
                  )}>
                    {balancesQuery.isLoading ? (
                      <span className="inline-block w-12 h-5 animate-pulse bg-muted rounded" />
                    ) : (
                      `${balancesQuery.data?.find((b: any) => b.leaveTypeId === selectedRequest?.leaveTypeId)?.closingBalance ?? 0} days`
                    )}
                  </p>
                  {(balancesQuery.data?.find((b: any) => b.leaveTypeId === selectedRequest?.leaveTypeId)?.closingBalance ?? 0) < (selectedRequest?.durationDays ?? 0) && !balancesQuery.isLoading && (
                    <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 font-bold">
                      Insufficient
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Approval Notes</label>
              <Textarea
                placeholder="Add any comments or notes for this approval/rejection"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="mt-2 bg-muted border-input min-h-24"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
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
              className={confirmAction === 'approve' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
            >
              {confirmAction === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
