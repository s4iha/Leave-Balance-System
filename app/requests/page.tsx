'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Calendar, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock leave request data
const mockRequests = [
  {
    id: '1',
    employee: 'Alice Johnson',
    leaveType: 'Paid Time Off',
    startDate: '2024-05-15',
    endDate: '2024-05-17',
    duration: 3,
    reason: 'Summer vacation',
    status: 'APPROVED',
    approvedBy: 'John Manager',
    approvalDate: '2024-05-10',
  },
  {
    id: '2',
    employee: 'Bob Smith',
    leaveType: 'Sick Leave',
    startDate: '2024-06-10',
    endDate: '2024-06-10',
    duration: 1,
    reason: 'Medical appointment',
    status: 'SUBMITTED',
    approvedBy: null,
    approvalDate: null,
  },
  {
    id: '3',
    employee: 'Alice Johnson',
    leaveType: 'Casual Leave',
    startDate: '2024-07-01',
    endDate: '2024-07-03',
    duration: 2,
    reason: 'Personal work',
    status: 'DRAFT',
    approvedBy: null,
    approvalDate: null,
  },
  {
    id: '4',
    employee: 'Carol White',
    leaveType: 'PTO',
    startDate: '2024-06-20',
    endDate: '2024-06-22',
    duration: 3,
    reason: 'Family visit',
    status: 'REJECTED',
    approvedBy: 'John Manager',
    approvalDate: '2024-06-15',
  },
  {
    id: '5',
    employee: 'David Brown',
    leaveType: 'Maternity Leave',
    startDate: '2024-07-01',
    endDate: '2024-09-29',
    duration: 90,
    reason: 'Maternity',
    status: 'APPROVED',
    approvedBy: 'Admin User',
    approvalDate: '2024-06-01',
  },
];

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
type StatusConfig = Record<string, { color: BadgeVariant; icon: typeof Clock }>;

const statusConfig: StatusConfig = {
  DRAFT: { color: 'secondary', icon: Clock },
  SUBMITTED: { color: 'outline', icon: Clock },
  APPROVED: { color: 'default', icon: CheckCircle2 },
  REJECTED: { color: 'destructive', icon: XCircle },
  CANCELLED: { color: 'secondary', icon: XCircle },
};

export default function RequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<(typeof mockRequests)[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

  // Filter by user (RLS - employees only see their own requests)
  const userRequests = user?.role === 'EMPLOYEE' 
    ? mockRequests.filter(req => req.employee === user?.name)
    : mockRequests;

  const filteredRequests = userRequests.filter((req) => {
    if (selectedStatus === 'ALL') return true;
    return req.status === selectedStatus;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNewRequest = () => {
    setSelectedRequest(null);
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (request: (typeof mockRequests)[0]) => {
    setSelectedRequest(request);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setRequestToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (requestToDelete) {
      toast({
        title: 'Request Deleted',
        description: 'Your leave request has been deleted successfully.',
      });
      setDeleteConfirmOpen(false);
      setRequestToDelete(null);
    }
  };

  const handleSaveRequest = () => {
    if (isEditMode) {
      toast({
        title: 'Request Updated',
        description: 'Your leave request has been updated successfully.',
      });
    } else {
      toast({
        title: 'Request Submitted',
        description: 'Your leave request has been submitted for approval.',
      });
    }
    setIsDialogOpen(false);
  };

  const getStatusColor = (status: string): BadgeVariant => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config?.color || 'outline';
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Leave Requests</h1>
                <p className="text-muted-foreground mt-2">Manage your leave requests and approvals</p>
              </div>
              <Button onClick={handleNewRequest} className="gap-2">
                <Plus className="w-4 h-4" />
                New Request
              </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{mockRequests.length}</div>
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
                    {mockRequests.filter((r) => r.status === 'SUBMITTED').length}
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
                    {mockRequests.filter((r) => r.status === 'APPROVED').length}
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
                    {mockRequests.filter((r) => r.status === 'DRAFT').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Header with Filter */}
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Leave Requests</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Select value={selectedStatus} onValueChange={(val) => {
                setSelectedStatus(val);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full md:w-48 bg-muted border-input flex-shrink-0">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Requests</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Requests Table */}
            <Card className="border-border">
              <CardHeader className="hidden">
                <CardTitle>Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
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
                      {paginatedRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium text-foreground">
                            {request.employee}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{request.leaveType}</TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(request.startDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(request.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{request.duration}d</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {request.approvedBy || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {['DRAFT', 'SUBMITTED'].includes(request.status) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(request)}
                                >
                                  Edit
                                </Button>
                              )}
                              {['DRAFT'].includes(request.status) && (
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Leave Request' : 'New Leave Request'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update your leave request' : 'Submit a new leave request'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Leave Type</label>
              <Select defaultValue={selectedRequest?.leaveType}>
                <SelectTrigger className="bg-muted border-input">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PTO">Paid Time Off</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Start Date</label>
              <Input
                type="date"
                defaultValue={selectedRequest?.startDate}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">End Date</label>
              <Input
                type="date"
                defaultValue={selectedRequest?.endDate}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Reason</label>
              <Input
                placeholder="Reason for leave"
                defaultValue={selectedRequest?.reason}
                className="bg-muted border-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRequest}>
              {isEditMode ? 'Update' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this leave request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
