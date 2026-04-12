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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Calendar, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

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

const statusConfig = {
  DRAFT: { color: 'secondary', icon: Clock },
  SUBMITTED: { color: 'outline', icon: Clock },
  APPROVED: { color: 'default', icon: CheckCircle2 },
  REJECTED: { color: 'destructive', icon: XCircle },
  CANCELLED: { color: 'secondary', icon: XCircle },
};

export default function RequestsPage() {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<(typeof mockRequests)[0] | null>(null);

  const filteredRequests = mockRequests.filter((req) => {
    if (selectedStatus === 'ALL') return true;
    return req.status === selectedStatus;
  });

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
    alert(`Would delete request ${id} (not implemented in demo)`);
  };

  const getStatusColor = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config?.color || 'outline';
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:ml-64">
          <div className="p-4 md:p-8">
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

            {/* Filter */}
            <Card className="mb-6 border-border">
              <CardContent className="pt-6">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full md:w-48 bg-muted border-input">
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
              </CardContent>
            </Card>

            {/* Requests Table */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>
                  {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
                </CardDescription>
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
                      {filteredRequests.map((request) => (
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
            <Button onClick={() => setIsDialogOpen(false)}>
              {isEditMode ? 'Update' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
