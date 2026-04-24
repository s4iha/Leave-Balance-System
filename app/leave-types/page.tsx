'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { MainContent } from '@/components/layout/main-content';
import { MobileHeader } from '@/components/layout/mobile-header';
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
import { Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/sonner-toast';

interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  maxDaysPerYear: number;
  requiresApproval: boolean;
  carryoverAllowed: boolean;
  carryoverMaxDays: number | null;
  carryoverExpiryDays: number | null;
  active: boolean;
}

interface LeaveTypeListResponse {
  leaveTypes: LeaveType[];
  total: number;
  page: number;
  pageSize: number;
}

interface LeaveTypeFormState {
  name: string;
  description: string;
  maxDaysPerYear: string;
  requiresApproval: boolean;
  carryoverAllowed: boolean;
  carryoverMaxDays: string;
  carryoverExpiryDays: string;
  active: boolean;
}

const initialFormState: LeaveTypeFormState = {
  name: '',
  description: '',
  maxDaysPerYear: '',
  requiresApproval: true,
  carryoverAllowed: false,
  carryoverMaxDays: '',
  carryoverExpiryDays: '',
  active: true,
};

export default function LeaveTypesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState<string | null>(null);
  const [formState, setFormState] = useState<LeaveTypeFormState>(initialFormState);

  const params = new URLSearchParams({
    skip: '0',
    take: '1000',
  });
  const paramsString = params.toString();

  const leaveTypesQuery = useQuery({
    queryKey: queryKeys.leaveTypes.list(paramsString),
    queryFn: () => apiRequestRaw<LeaveTypeListResponse>(`/api/v1/leave-types?${paramsString}`),
    enabled: Boolean(user && user.role === 'ADMIN'),
  });

  useEffect(() => {
    if (!leaveTypesQuery.isError) return;
    console.error('Error fetching leave types:', leaveTypesQuery.error);
    toast({
      title: 'Error',
      description: 'Failed to load leave types.',
      variant: 'destructive',
    });
  }, [leaveTypesQuery.error, leaveTypesQuery.isError, toast]);

  const upsertLeaveTypeMutation = useMutation({
    mutationFn: async (payload: {
      id?: string;
      name: string;
      description: string | null;
      maxDaysPerYear: number;
      requiresApproval: boolean;
      carryoverAllowed: boolean;
      carryoverMaxDays: number | null;
      carryoverExpiryDays: number | null;
      active: boolean;
    }) => {
      const isUpdate = Boolean(payload.id);
      const path = isUpdate ? `/api/v1/leave-types/${payload.id}` : '/api/v1/leave-types';
      const method = isUpdate ? 'PUT' : 'POST';

      return apiRequestRaw<LeaveType>(path, {
        method,
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          maxDaysPerYear: payload.maxDaysPerYear,
          requiresApproval: payload.requiresApproval,
          carryoverAllowed: payload.carryoverAllowed,
          carryoverMaxDays: payload.carryoverMaxDays,
          carryoverExpiryDays: payload.carryoverExpiryDays,
          ...(isUpdate && { active: payload.active }),
        }),
      });
    },
    onSuccess: (_, variables) => {
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.leaveTypes.list(paramsString) });
      queryClient.invalidateQueries({ queryKey: ['leave-types', 'list'], refetchType: 'none' });
      toast({
        title: variables.id ? 'Leave Type Updated' : 'Leave Type Created',
        description: `${variables.name} has been ${variables.id ? 'updated' : 'created'} successfully.`,
      });
    },
  });

  const deleteLeaveTypeMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequestRaw<{ message: string }>(`/api/v1/leave-types/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaveTypes.list(paramsString) });
      queryClient.invalidateQueries({ queryKey: ['leave-types', 'list'], refetchType: 'none' });
      toast({
        title: 'Leave Type Deleted',
        description: 'The leave type has been marked inactive.',
      });
    },
  });

  const leaveTypes = leaveTypesQuery.data?.leaveTypes ?? [];

  const handleEdit = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setIsEditMode(true);
    setFormState({
      name: leaveType.name,
      description: leaveType.description ?? '',
      maxDaysPerYear: String(leaveType.maxDaysPerYear),
      requiresApproval: leaveType.requiresApproval,
      carryoverAllowed: leaveType.carryoverAllowed,
      carryoverMaxDays: leaveType.carryoverMaxDays !== null ? String(leaveType.carryoverMaxDays) : '',
      carryoverExpiryDays:
        leaveType.carryoverExpiryDays !== null ? String(leaveType.carryoverExpiryDays) : '',
      active: leaveType.active,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedLeaveType(null);
    setIsEditMode(false);
    setFormState(initialFormState);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setLeaveTypeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!leaveTypeToDelete) return;
    try {
      await deleteLeaveTypeMutation.mutateAsync(leaveTypeToDelete);
      setDeleteConfirmOpen(false);
      setLeaveTypeToDelete(null);
    } catch (error) {
      console.error('Error deleting leave type:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete leave type.',
        variant: 'destructive',
      });
    } 
  };

  const parseRequiredInt = (value: string, field: string): number | null => {
    if (!value.trim()) {
      toast({
        title: 'Validation Error',
        description: `${field} is required.`,
        variant: 'destructive',
      });
      return null;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      toast({
        title: 'Validation Error',
        description: `${field} must be a positive whole number.`,
        variant: 'destructive',
      });
      return null;
    }
    return parsed;
  };

  const parseOptionalNonNegativeInt = (value: string, field: string): number | null => {
    if (!value.trim()) {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      toast({
        title: 'Validation Error',
        description: `${field} must be a non-negative whole number.`,
        variant: 'destructive',
      });
      return null;
    }
    return parsed;
  };

  const handleSaveLeaveType = async () => {
    const name = formState.name.trim();
    if (!name) {
      toast({
        title: 'Validation Error',
        description: 'Leave type name is required.',
        variant: 'destructive',
      });
      return;
    }

    const maxDaysPerYear = parseRequiredInt(formState.maxDaysPerYear, 'Max days per year');
    if (maxDaysPerYear === null) {
      return;
    }

    const carryoverMaxDays = formState.carryoverAllowed
      ? parseOptionalNonNegativeInt(formState.carryoverMaxDays, 'Carryover max days')
      : null;
    const carryoverExpiryDays = formState.carryoverAllowed
      ? parseOptionalNonNegativeInt(formState.carryoverExpiryDays, 'Carryover expiry days')
      : null;
    if (formState.carryoverAllowed && formState.carryoverMaxDays.trim() && carryoverMaxDays === null) {
      return;
    }
    if (
      formState.carryoverAllowed &&
      formState.carryoverExpiryDays.trim() &&
      carryoverExpiryDays === null
    ) {
      return;
    }

    if (formState.carryoverAllowed && carryoverMaxDays !== null && carryoverMaxDays > maxDaysPerYear) {
      toast({
        title: 'Validation Error',
        description: 'Carryover max days cannot exceed max days per year.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await upsertLeaveTypeMutation.mutateAsync({
        id: selectedLeaveType?.id,
        name,
        description: formState.description.trim() || null,
        maxDaysPerYear,
        requiresApproval: formState.requiresApproval,
        carryoverAllowed: formState.carryoverAllowed,
        carryoverMaxDays,
        carryoverExpiryDays,
        active: formState.active,
      });
    } catch (error) {
      console.error('Error saving leave type:', error);
      toast({
        title: 'Error',
        description: 'Failed to save leave type.',
        variant: 'destructive',
      });
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <ProtectedRoute requiredRoles={['ADMIN']}>
      <div className="flex h-screen bg-background">
        <MobileHeader />
        <Sidebar />
        <MainContent>
          <div className="pt-4 pr-4 pb-4 pl-0 md:pt-8 md:pr-8 md:pb-8 md:pl-0 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Leave Types</h1>
                <p className="text-muted-foreground mt-2">Configure leave types and policies</p>
              </div>
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="w-4 h-4" />
                New Leave Type
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{leaveTypes.length}</div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {leaveTypes.filter((t) => t.active).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Require Approval
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {leaveTypes.filter((t) => t.requiresApproval).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Carryover Allowed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {leaveTypes.filter((t) => t.carryoverAllowed).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leave Types Table */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Leave Type Configuration</CardTitle>
                <CardDescription>Manage all leave types and their policies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Max Days/Year</TableHead>
                        <TableHead>Requires Approval</TableHead>
                        <TableHead>Carryover</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveTypesQuery.isLoading && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Loading leave types...
                          </TableCell>
                        </TableRow>
                      )}
                      {!leaveTypesQuery.isLoading && leaveTypes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No leave types found.
                          </TableCell>
                        </TableRow>
                      )}
                      {leaveTypes.map((leaveType) => (
                        <TableRow key={leaveType.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{leaveType.name}</p>
                              <p className="text-sm text-muted-foreground">{leaveType.description}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {leaveType.maxDaysPerYear} days
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={leaveType.requiresApproval ? 'default' : 'secondary'}
                              className="gap-1"
                            >
                              {leaveType.requiresApproval ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Required
                                </>
                              ) : (
                                'Not Required'
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {leaveType.carryoverAllowed ? (
                              <Badge variant="outline" className="gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {leaveType.carryoverMaxDays !== null
                                  ? `${leaveType.carryoverMaxDays} days max`
                                  : 'Allowed'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Not Allowed</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={leaveType.active ? 'default' : 'secondary'}>
                              {leaveType.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(leaveType)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(leaveType.id)}
                                disabled={deleteLeaveTypeMutation.isPending}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
        </MainContent>
      </div>

      {/* Leave Type Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Leave Type' : 'New Leave Type'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? `Update ${selectedLeaveType?.name} configuration`
                : 'Create a new leave type for your organization'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Leave Type Name</label>
              <Input
                placeholder="e.g., Paid Time Off"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input
                placeholder="Brief description of this leave type"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Max Days Per Year</label>
              <Input
                type="number"
                placeholder="20"
                min={1}
                value={formState.maxDaysPerYear}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, maxDaysPerYear: event.target.value }))
                }
                className="bg-muted border-input"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-t border-border">
              <label className="text-sm font-medium text-foreground">Requires Approval</label>
              <Switch
                checked={formState.requiresApproval}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, requiresApproval: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between py-3 border-t border-border">
              <label className="text-sm font-medium text-foreground">Allow Carryover</label>
              <Switch
                checked={formState.carryoverAllowed}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({
                    ...prev,
                    carryoverAllowed: checked,
                    carryoverMaxDays: checked ? prev.carryoverMaxDays : '',
                    carryoverExpiryDays: checked ? prev.carryoverExpiryDays : '',
                  }))
                }
              />
            </div>
            {formState.carryoverAllowed && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Carryover Max Days (Optional)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g., 5"
                    value={formState.carryoverMaxDays}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, carryoverMaxDays: event.target.value }))
                    }
                    className="bg-muted border-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Carryover Expiry Days (Optional)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g., 90"
                    value={formState.carryoverExpiryDays}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, carryoverExpiryDays: event.target.value }))
                    }
                    className="bg-muted border-input"
                  />
                </div>
              </>
            )}
            <div className="flex items-center justify-between py-3 border-t border-border">
              <label className="text-sm font-medium text-foreground">Active</label>
              <Switch
                checked={formState.active}
                onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveLeaveType}
              disabled={upsertLeaveTypeMutation.isPending}
            >
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) {
            setLeaveTypeToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Leave Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this leave type? This will mark it inactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteLeaveTypeMutation.isPending}
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
