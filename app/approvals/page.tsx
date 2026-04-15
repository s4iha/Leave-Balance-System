'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
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
import { useToast } from '@/hooks/use-toast';

// Mock pending requests for approval
const mockPendingRequests = [
  {
    id: '2',
    employee: 'Bob Smith',
    department: 'Sales',
    leaveType: 'Sick Leave',
    startDate: '2024-06-10',
    endDate: '2024-06-10',
    duration: 1,
    reason: 'Medical appointment',
    submittedDate: '2024-06-05',
    currentBalance: 10,
  },
  {
    id: '6',
    employee: 'Eve Wilson',
    department: 'Marketing',
    leaveType: 'Paid Time Off',
    startDate: '2024-07-15',
    endDate: '2024-07-19',
    duration: 5,
    reason: 'Conference attendance and travel',
    submittedDate: '2024-06-20',
    currentBalance: 12,
  },
  {
    id: '7',
    employee: 'Frank Miller',
    department: 'Engineering',
    leaveType: 'Casual Leave',
    startDate: '2024-06-24',
    endDate: '2024-06-25',
    duration: 2,
    reason: 'Personal work at home',
    submittedDate: '2024-06-18',
    currentBalance: 5,
  },
];

const mockApprovedRequests = [
  {
    id: '1',
    employee: 'Alice Johnson',
    leaveType: 'Paid Time Off',
    startDate: '2024-05-15',
    endDate: '2024-05-17',
    duration: 3,
    approvalDate: '2024-05-10',
    status: 'approved',
  },
];

export default function ApprovalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<(typeof mockPendingRequests)[0] | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const totalPages = Math.ceil(mockPendingRequests.length / itemsPerPage);
  const paginatedRequests = mockPendingRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApprove = (request: (typeof mockPendingRequests)[0]) => {
    setSelectedRequest(request);
    setApprovalNotes('');
    setConfirmAction('approve');
    setConfirmDialogOpen(true);
  };

  const handleReject = (request: (typeof mockPendingRequests)[0]) => {
    setSelectedRequest(request);
    setApprovalNotes('');
    setConfirmAction('reject');
    setConfirmDialogOpen(true);
  };

  const confirmApprovalAction = () => {
    if (selectedRequest && confirmAction) {
      if (confirmAction === 'approve') {
        toast({
          title: 'Request Approved',
          description: `${selectedRequest.employee}'s leave request has been approved.`,
        });
      } else {
        toast({
          title: 'Request Rejected',
          description: `${selectedRequest.employee}'s leave request has been rejected.`,
        });
      }
      setConfirmDialogOpen(false);
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      setConfirmAction(null);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:ml-64">
          <div className="p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Approvals</h1>
              <p className="text-muted-foreground mt-2">Review and approve leave requests from your team</p>
            </div>

            {/* Alert for pending approvals */}
            {mockPendingRequests.length > 0 && (
              <Card className="mb-4 border-accent/20 bg-accent/5">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Pending Approvals</h3>
                      <p className="text-sm text-muted-foreground">
                        You have {mockPendingRequests.length} leave request{mockPendingRequests.length !== 1 ? 's' : ''} waiting for your approval.
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
                  onClick={() => setActiveTab('pending')}
                  className={`px-4 py-2 border-b-2 transition-colors font-medium ${activeTab === 'pending'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Pending Requests ({mockPendingRequests.length})
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`px-4 py-2 border-b-2 transition-colors font-medium ${activeTab === 'approved'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Approved Requests ({mockApprovedRequests.length})
                </button>
              </div>
            </div>

            {activeTab === 'pending' && (
              <div className="space-y-4">
                {paginatedRequests.length === 0 && mockPendingRequests.length === 0 ? (
                  <Card className="border-border">
                    <CardContent className="pt-8 pb-8 text-center">
                      <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No Pending Approvals</h3>
                      <p className="text-muted-foreground">All leave requests have been reviewed.</p>
                    </CardContent>
                  </Card>
                ) : (
                  paginatedRequests.map((request) => (
                    <Card key={request.id} className="border-border hover:border-accent/50 transition-colors">
                      <CardContent className="pt-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-foreground">{request.employee}</h3>
                          <p className="text-sm text-muted-foreground">{request.department}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase">Leave Type</p>
                            <Badge variant="outline">{request.leaveType}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase">Duration</p>
                            <p className="font-medium text-foreground">{request.duration} days</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase">Current Balance</p>
                            <p className="font-medium text-foreground">{request.currentBalance} days</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase">Submitted</p>
                            <p className="text-sm text-foreground">
                              {new Date(request.submittedDate).toLocaleDateString()}
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
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
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
                        {mockApprovedRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium text-foreground">
                              {request.employee}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{request.leaveType}</TableCell>
                            <TableCell className="text-muted-foreground">{request.duration} days</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(request.startDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(request.approvalDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
              {selectedRequest?.employee}&apos;s {selectedRequest?.leaveType} request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Duration</p>
                  <p className="font-medium text-foreground">{selectedRequest?.duration} days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Current Balance</p>
                  <p className="font-medium text-foreground">{selectedRequest?.currentBalance} days</p>
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
              Are you sure you want to {confirmAction} this leave request from {selectedRequest?.employee}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprovalAction}
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
