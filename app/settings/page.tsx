'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Edit, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

// Mock adjustment data
const mockAdjustments = [
  {
    id: '1',
    employee: 'Alice Johnson',
    leaveType: 'PTO',
    adjustmentType: 'bonus',
    adjustmentDays: 2,
    reason: 'Performance bonus for Q2 excellence',
    approvedBy: 'Admin User',
    approvalDate: '2024-06-01',
    status: 'approved',
  },
  {
    id: '2',
    employee: 'Bob Smith',
    leaveType: 'Sick Leave',
    adjustmentType: 'correction',
    adjustmentDays: -1,
    reason: 'Correction for incorrectly applied sick day',
    approvedBy: 'Admin User',
    approvalDate: '2024-05-28',
    status: 'approved',
  },
  {
    id: '3',
    employee: 'Carol White',
    leaveType: 'PTO',
    adjustmentType: 'compensation',
    adjustmentDays: 3,
    reason: 'Compensation for unpaid overtime hours',
    approvedBy: null,
    approvalDate: null,
    status: 'pending',
  },
];

// Mock audit logs
const mockAuditLogs = [
  {
    id: '1',
    timestamp: '2024-06-15 14:30:00',
    action: 'APPROVE',
    user: 'John Manager',
    subject: 'Approved leave request from Alice Johnson',
    details: 'PTO request for 3 days approved',
  },
  {
    id: '2',
    timestamp: '2024-06-14 10:15:00',
    action: 'SUBMIT',
    user: 'Bob Smith',
    subject: 'Submitted leave request',
    details: 'Sick leave request for 1 day submitted',
  },
  {
    id: '3',
    timestamp: '2024-06-13 16:45:00',
    action: 'CREATE',
    user: 'Admin User',
    subject: 'Created new employee record',
    details: 'New employee David Brown added to system',
  },
  {
    id: '4',
    timestamp: '2024-06-12 09:20:00',
    action: 'UPDATE',
    user: 'Admin User',
    subject: 'Updated leave balance',
    details: 'Manual adjustment of PTO for Alice Johnson',
  },
];

const adjustmentTypes = [
  { value: 'bonus', label: 'Bonus/Incentive' },
  { value: 'correction', label: 'Correction' },
  { value: 'compensation', label: 'Compensation' },
  { value: 'adjustment', label: 'General Adjustment' },
];

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const actionColors: Record<string, BadgeVariant> = {
  APPROVE: 'default',
  REJECT: 'destructive',
  SUBMIT: 'outline',
  CREATE: 'secondary',
  UPDATE: 'outline',
  DELETE: 'destructive',
  ADJUSTMENT: 'secondary',
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'adjustments' | 'audit'>('adjustments');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<(typeof mockAdjustments)[0] | null>(null);

  const handleNewAdjustment = () => {
    setSelectedAdjustment(null);
    setIsDialogOpen(true);
  };

  const handleEditAdjustment = (adjustment: (typeof mockAdjustments)[0]) => {
    setSelectedAdjustment(adjustment);
    setIsDialogOpen(true);
  };

  const handleDeleteAdjustment = (id: string) => {
    alert(`Would delete adjustment ${id} (not implemented in demo)`);
  };

  const getActionColor = (action: string): BadgeVariant => {
    return actionColors[action as keyof typeof actionColors] || 'outline';
  };

  return (
    <ProtectedRoute requiredRoles={['ADMIN']}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Settings & Administration</h1>
              <p className="text-muted-foreground mt-2">Manage leave adjustments and view system audit logs</p>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-border">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('adjustments')}
                  className={`px-4 py-2 border-b-2 transition-colors font-medium ${
                    activeTab === 'adjustments'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Balance Adjustments
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-4 py-2 border-b-2 transition-colors font-medium ${
                    activeTab === 'audit'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Audit Logs
                </button>
              </div>
            </div>

            {activeTab === 'adjustments' && (
              <div>
                {/* Header with action button */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Balance Adjustments</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage manual leave balance adjustments for employees
                    </p>
                  </div>
                  <Button onClick={handleNewAdjustment} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Adjustment
                  </Button>
                </div>

                {/* Pending Adjustments Alert */}
                {mockAdjustments.some((a) => a.status === 'pending') && (
                  <Card className="mb-6 border-accent/20 bg-accent/5">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <AlertCircle className="w-5 h-5 text-accent mt-1" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Pending Adjustments</h3>
                          <p className="text-sm text-muted-foreground">
                            There is {mockAdjustments.filter((a) => a.status === 'pending').length} adjustment{' '}
                            {mockAdjustments.filter((a) => a.status === 'pending').length !== 1 ? 's' : ''} pending approval.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Adjustments Table */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Recent Adjustments</CardTitle>
                    <CardDescription>Manual balance adjustments and corrections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Leave Type</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Days</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockAdjustments.map((adjustment) => (
                            <TableRow key={adjustment.id}>
                              <TableCell className="font-medium text-foreground">
                                {adjustment.employee}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{adjustment.leaveType}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {adjustment.adjustmentType}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-foreground">
                                <span className={adjustment.adjustmentDays > 0 ? 'text-green-500' : 'text-red-500'}>
                                  {adjustment.adjustmentDays > 0 ? '+' : ''}{adjustment.adjustmentDays}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                                {adjustment.reason}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={adjustment.status === 'approved' ? 'default' : 'outline'}
                                  className="capitalize"
                                >
                                  {adjustment.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {adjustment.status === 'pending' && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditAdjustment(adjustment)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteAdjustment(adjustment.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
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
            )}

            {activeTab === 'audit' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Audit Trail</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete system audit log of all actions and changes
                  </p>
                </div>

                {/* Audit Logs Table */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>System Activity Log</CardTitle>
                    <CardDescription>All system actions and modifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockAuditLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="text-muted-foreground text-sm">{log.timestamp}</TableCell>
                              <TableCell>
                                <Badge variant={getActionColor(log.action)} className="capitalize">
                                  {log.action}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-foreground">{log.user}</TableCell>
                              <TableCell className="text-foreground font-medium">{log.subject}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{log.details}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Adjustment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAdjustment ? 'Edit Adjustment' : 'New Balance Adjustment'}
            </DialogTitle>
            <DialogDescription>
              {selectedAdjustment
                ? `Update adjustment for ${selectedAdjustment.employee}`
                : 'Create a manual balance adjustment for an employee'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Employee</label>
              <Input
                placeholder="Select employee"
                defaultValue={selectedAdjustment?.employee}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Leave Type</label>
              <Input
                placeholder="Select leave type"
                defaultValue={selectedAdjustment?.leaveType}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Adjustment Type</label>
              <Select defaultValue={selectedAdjustment?.adjustmentType}>
                <SelectTrigger className="bg-muted border-input">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {adjustmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Days</label>
              <Input
                type="number"
                placeholder="e.g., +2 or -1"
                defaultValue={selectedAdjustment?.adjustmentDays}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Reason</label>
              <Textarea
                placeholder="Reason for adjustment"
                defaultValue={selectedAdjustment?.reason}
                className="bg-muted border-input min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>
              {selectedAdjustment ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
