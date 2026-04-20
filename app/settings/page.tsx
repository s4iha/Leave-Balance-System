'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/sonner-toast';

const adjustmentTypes = [
  { value: 'bonus', label: 'Bonus/Incentive' },
  { value: 'correction', label: 'Correction' },
  { value: 'compensation', label: 'Compensation' },
  { value: 'adjustment', label: 'General Adjustment' },
] as const;

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

interface AdjustmentRecord {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  adjustmentType: string;
  adjustmentDays: number;
  reason: string;
  approvedBy: string;
  approvalDate: string;
  effectiveDate: string;
  employee: {
    id: string;
    user: {
      name: string | null;
      email: string | null;
    };
  };
  leaveType: {
    id: string;
    name: string;
  };
  approver: {
    id: string;
    name: string | null;
  };
}

interface AdjustmentListResponse {
  adjustments: AdjustmentRecord[];
  total: number;
  page: number;
  pageSize: number;
}

interface AuditLogRecord {
  id: string;
  actionType: string;
  description: string;
  changes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
  };
}

interface AuditLogListResponse {
  logs: AuditLogRecord[];
  total: number;
  page: number;
  pageSize: number;
}

interface EmployeeOption {
  id: string;
  user: {
    name: string | null;
  };
}

interface EmployeeListResponse {
  employees: EmployeeOption[];
}

interface LeaveTypeOption {
  id: string;
  name: string;
}

interface LeaveTypeListResponse {
  leaveTypes: LeaveTypeOption[];
}

interface AdjustmentFormData {
  employeeId: string;
  leaveTypeId: string;
  adjustmentType: string;
  adjustmentDays: string;
  reason: string;
}

const getDefaultFormData = (): AdjustmentFormData => ({
  employeeId: '',
  leaveTypeId: '',
  adjustmentType: '',
  adjustmentDays: '',
  reason: '',
});

const getAdjustmentStatus = (adjustment: AdjustmentRecord) =>
  adjustment.approvalDate ? 'approved' : 'pending';

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'adjustments' | 'audit'>('adjustments');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<AdjustmentRecord | null>(null);
  const [adjustmentToDelete, setAdjustmentToDelete] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<AdjustmentFormData>(getDefaultFormData());

  const canAccess = Boolean(user && user.role === 'ADMIN');

  const adjustmentsParams = new URLSearchParams({
    skip: '0',
    take: '100',
  }).toString();

  const auditLogsParams = new URLSearchParams({
    skip: '0',
    take: '100',
  }).toString();

  const adjustmentsQuery = useQuery({
    queryKey: queryKeys.adjustments.list(adjustmentsParams),
    queryFn: () => apiRequestRaw<AdjustmentListResponse>(`/api/v1/adjustments?${adjustmentsParams}`),
    enabled: canAccess && activeTab === 'adjustments',
  });

  const auditLogsQuery = useQuery({
    queryKey: queryKeys.auditLogs.list(auditLogsParams),
    queryFn: () => apiRequestRaw<AuditLogListResponse>(`/api/v1/audit-logs?${auditLogsParams}`),
    enabled: canAccess && activeTab === 'audit',
  });

  const employeesQuery = useQuery({
    queryKey: queryKeys.employees.list('skip=0&take=100'),
    queryFn: () => apiRequestRaw<EmployeeListResponse>('/api/v1/employees?skip=0&take=100'),
    enabled: canAccess,
  });

  const leaveTypesQuery = useQuery({
    queryKey: queryKeys.leaveTypes.list('skip=0&take=100'),
    queryFn: () => apiRequestRaw<LeaveTypeListResponse>('/api/v1/leave-types?skip=0&take=100'),
    enabled: canAccess,
  });

  useEffect(() => {
    if (!adjustmentsQuery.isError) return;
    console.error('Error fetching adjustments:', adjustmentsQuery.error);
    toast({
      title: 'Error',
      description: 'Failed to load adjustments',
      variant: 'destructive',
    });
  }, [adjustmentsQuery.error, adjustmentsQuery.isError, toast]);

  useEffect(() => {
    if (!auditLogsQuery.isError) return;
    console.error('Error fetching audit logs:', auditLogsQuery.error);
    toast({
      title: 'Error',
      description: 'Failed to load audit logs',
      variant: 'destructive',
    });
  }, [auditLogsQuery.error, auditLogsQuery.isError, toast]);

  const createAdjustmentMutation = useMutation({
    mutationFn: (payload: { employeeId: string; leaveTypeId: string; adjustmentType: string; adjustmentDays: number; reason: string }) =>
      apiRequestRaw<AdjustmentRecord>('/api/v1/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast({
        title: 'Adjustment created',
        description: 'The balance adjustment has been created successfully.',
      });
      setIsDialogOpen(false);
      setSelectedAdjustment(null);
      setFormData(getDefaultFormData());
      queryClient.invalidateQueries({ queryKey: queryKeys.adjustments.list(adjustmentsParams) });
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs.list(auditLogsParams), refetchType: 'none' });
    },
  });

  const updateAdjustmentMutation = useMutation({
    mutationFn: (payload: { id: string; adjustmentType: string; adjustmentDays: number; reason: string }) =>
      apiRequestRaw<AdjustmentRecord>(`/api/v1/adjustments/${payload.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustmentType: payload.adjustmentType,
          adjustmentDays: payload.adjustmentDays,
          reason: payload.reason,
        }),
      }),
    onSuccess: () => {
      toast({
        title: 'Adjustment updated',
        description: 'The balance adjustment has been updated successfully.',
      });
      setIsDialogOpen(false);
      setSelectedAdjustment(null);
      setFormData(getDefaultFormData());
      queryClient.invalidateQueries({ queryKey: queryKeys.adjustments.list(adjustmentsParams) });
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs.list(auditLogsParams), refetchType: 'none' });
    },
  });

  const deleteAdjustmentMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequestRaw<{ message: string }>(`/api/v1/adjustments/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast({
        title: 'Adjustment deleted',
        description: 'The adjustment has been deleted.',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.adjustments.list(adjustmentsParams) });
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs.list(auditLogsParams), refetchType: 'none' });
    },
  });

  const adjustments = adjustmentsQuery.data?.adjustments || [];
  const auditLogs = auditLogsQuery.data?.logs || [];
  const employees = employeesQuery.data?.employees || [];
  const leaveTypes = leaveTypesQuery.data?.leaveTypes || [];

  const pendingAdjustments = useMemo(
    () => adjustments.filter((adjustment) => getAdjustmentStatus(adjustment) === 'pending'),
    [adjustments]
  );

  const handleNewAdjustment = () => {
    setSelectedAdjustment(null);
    setFormData(getDefaultFormData());
    setIsDialogOpen(true);
  };

  const handleEditAdjustment = (adjustment: AdjustmentRecord) => {
    setSelectedAdjustment(adjustment);
    setFormData({
      employeeId: adjustment.employeeId,
      leaveTypeId: adjustment.leaveTypeId,
      adjustmentType: adjustment.adjustmentType,
      adjustmentDays: String(adjustment.adjustmentDays),
      reason: adjustment.reason,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteAdjustment = (id: string) => {
    setAdjustmentToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteAdjustment = async () => {
    if (!adjustmentToDelete) return;
    try {
      await deleteAdjustmentMutation.mutateAsync(adjustmentToDelete);
      setDeleteConfirmOpen(false);
      setAdjustmentToDelete(null);
    } catch (error) {
      console.error('Error deleting adjustment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete adjustment.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveAdjustment = async () => {
    if (!formData.employeeId || !formData.leaveTypeId || !formData.adjustmentType || !formData.reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Employee, leave type, adjustment type, and reason are required.',
        variant: 'destructive',
      });
      return;
    }

    const adjustmentDays = parseFloat(formData.adjustmentDays);
    if (Number.isNaN(adjustmentDays) || adjustmentDays === 0) {
      toast({
        title: 'Validation Error',
        description: 'Adjustment days must be a non-zero number.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (selectedAdjustment) {
        await updateAdjustmentMutation.mutateAsync({
          id: selectedAdjustment.id,
          adjustmentType: formData.adjustmentType,
          adjustmentDays,
          reason: formData.reason.trim(),
        });
      } else {
        await createAdjustmentMutation.mutateAsync({
          employeeId: formData.employeeId,
          leaveTypeId: formData.leaveTypeId,
          adjustmentType: formData.adjustmentType,
          adjustmentDays,
          reason: formData.reason.trim(),
        });
      }
    } catch (error) {
      console.error('Error saving adjustment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save adjustment.',
        variant: 'destructive',
      });
    }
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Settings & Administration</h1>
              <p className="text-muted-foreground mt-2">Manage leave adjustments and view system audit logs</p>
            </div>

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
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Balance Adjustments</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage manual leave balance adjustments for employees
                    </p>
                  </div>
                  <Button onClick={handleNewAdjustment} className="gap-2" disabled={!canAccess}>
                    <Plus className="w-4 h-4" />
                    New Adjustment
                  </Button>
                </div>

                {pendingAdjustments.length > 0 && (
                  <Card className="mb-6 border-accent/20 bg-accent/5">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <AlertCircle className="w-5 h-5 text-accent mt-1" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Pending Adjustments</h3>
                          <p className="text-sm text-muted-foreground">
                            There {pendingAdjustments.length === 1 ? 'is' : 'are'} {pendingAdjustments.length} adjustment
                            {pendingAdjustments.length === 1 ? '' : 's'} pending approval.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                          {adjustmentsQuery.isLoading && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground">
                                Loading adjustments...
                              </TableCell>
                            </TableRow>
                          )}
                          {!adjustmentsQuery.isLoading && adjustments.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground">
                                No adjustments found.
                              </TableCell>
                            </TableRow>
                          )}
                          {adjustments.map((adjustment) => {
                            const status = getAdjustmentStatus(adjustment);

                            return (
                              <TableRow key={adjustment.id}>
                                <TableCell className="font-medium text-foreground">
                                  {adjustment.employee.user.name || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{adjustment.leaveType.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">
                                    {adjustment.adjustmentType}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-foreground">
                                  <span className={adjustment.adjustmentDays > 0 ? 'text-green-500' : 'text-red-500'}>
                                    {adjustment.adjustmentDays > 0 ? '+' : ''}
                                    {adjustment.adjustmentDays}
                                  </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                                  {adjustment.reason}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={status === 'approved' ? 'default' : 'outline'} className="capitalize">
                                    {status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEditAdjustment(adjustment)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteAdjustment(adjustment.id)}
                                      className="text-destructive hover:text-destructive"
                                      disabled={deleteAdjustmentMutation.isPending}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
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
                          {auditLogsQuery.isLoading && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                Loading audit logs...
                              </TableCell>
                            </TableRow>
                          )}
                          {!auditLogsQuery.isLoading && auditLogs.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No audit logs found.
                              </TableCell>
                            </TableRow>
                          )}
                          {auditLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(log.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getActionColor(log.actionType)} className="capitalize">
                                  {log.actionType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-foreground">{log.user?.name || 'System'}</TableCell>
                              <TableCell className="text-foreground font-medium">{log.description}</TableCell>
                              <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                                {log.changes || '-'}
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
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedAdjustment ? 'Edit Adjustment' : 'New Balance Adjustment'}</DialogTitle>
            <DialogDescription>
              {selectedAdjustment ? 'Update an existing balance adjustment' : 'Create a manual balance adjustment for an employee'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Employee</label>
              <Select
                value={formData.employeeId || undefined}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, employeeId: value }))}
                disabled={Boolean(selectedAdjustment)}
              >
                <SelectTrigger className="bg-muted border-input">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.user.name || employee.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Leave Type</label>
              <Select
                value={formData.leaveTypeId || undefined}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, leaveTypeId: value }))}
                disabled={Boolean(selectedAdjustment)}
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
              <label className="text-sm font-medium text-foreground">Adjustment Type</label>
              <Select
                value={formData.adjustmentType || undefined}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, adjustmentType: value }))}
              >
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
                value={formData.adjustmentDays}
                onChange={(event) => setFormData((prev) => ({ ...prev, adjustmentDays: event.target.value }))}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Reason</label>
              <Textarea
                placeholder="Reason for adjustment"
                value={formData.reason}
                onChange={(event) => setFormData((prev) => ({ ...prev, reason: event.target.value }))}
                className="bg-muted border-input min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAdjustment}
              disabled={createAdjustmentMutation.isPending || updateAdjustmentMutation.isPending}
            >
              {selectedAdjustment ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) {
            setAdjustmentToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Adjustment</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this adjustment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAdjustment}
              disabled={deleteAdjustmentMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
