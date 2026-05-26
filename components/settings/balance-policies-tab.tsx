'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
import { Edit, Plus, Settings, Trash2 } from 'lucide-react';
import { apiRequestRaw } from '@/lib/api-client';
import { toast, showErrorToast } from '@/lib/sonner-toast';
import { SkeletonTable } from '@/components/ui/skeleton';
import { AccrualScheme } from '@/lib/prisma';

interface BalancePolicy {
  id: string;
  leaveTypeId: string;
  leaveType: { name: string };
  classificationId: string | null;
  classification: { name: string } | null;
  initialCredits: number;
  accrualRate: number;
  maxCarryover: number | null;
  frequency: AccrualScheme;
  isActive: boolean;
}

export function BalancePoliciesTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<BalancePolicy | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedPolicy, setSelectedPolicy] = useState<BalancePolicy | null>(null);

  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [classificationId, setClassificationId] = useState('DEFAULT');
  const [initialCredits, setInitialCredits] = useState('0');
  const [accrualRate, setAccrualRate] = useState('0');
  const [maxCarryover, setMaxCarryover] = useState('');
  const [frequency, setFrequency] = useState<AccrualScheme>(AccrualScheme.MONTHLY);

  const policiesQuery = useQuery({
    queryKey: ['balance-policies'],
    queryFn: () => apiRequestRaw<{ success: boolean; data: BalancePolicy[] }>('/api/v1/settings/balance-policies', {}, user?.id, user?.email),
  });

  const leaveTypesQuery = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => apiRequestRaw<{ leaveTypes: { id: string; name: string }[] }>('/api/v1/leave-types?skip=0&take=100', {}, user?.id, user?.email),
  });

  const classificationsQuery = useQuery({
    queryKey: ['classifications'],
    queryFn: () => apiRequestRaw<{ data: { id: string; name: string }[] }>('/api/v1/classifications', {}, user?.id, user?.email),
  });

  const createPolicyMutation = useMutation({
    mutationFn: (payload: any) =>
      apiRequestRaw('/api/v1/settings/balance-policies', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, user?.id, user?.email),
    onSuccess: () => {
      toast({ title: 'Policy created successfully' });
      queryClient.invalidateQueries({ queryKey: ['balance-policies'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      showErrorToast(error, 'Failed to create policy');
    },
  });

  const updatePolicyMutation = useMutation({
    mutationFn: (payload: any) =>
      apiRequestRaw(`/api/v1/settings/balance-policies/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }, user?.id, user?.email),
    onSuccess: () => {
      toast({ title: 'Policy updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['balance-policies'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      showErrorToast(error, 'Failed to update policy');
    },
  });

  const deletePolicyMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequestRaw(`/api/v1/settings/balance-policies/${id}`, {
        method: 'DELETE',
      }, user?.id, user?.email),
    onSuccess: () => {
      toast({ title: 'Policy deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['balance-policies'] });
      setDeleteDialogOpen(false);
      setPolicyToDelete(null);
    },
    onError: (error: any) => {
      showErrorToast(error, 'Failed to delete policy');
    },
  });

  const resetForm = () => {
    setLeaveTypeId('');
    setClassificationId('DEFAULT');
    setInitialCredits('0');
    setAccrualRate('0');
    setMaxCarryover('');
    setFrequency(AccrualScheme.MONTHLY);
    setSelectedPolicy(null);
  };

  const handleCreateOpen = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditOpen = (policy: BalancePolicy) => {
    setSelectedPolicy(policy);
    setLeaveTypeId(policy.leaveTypeId);
    setClassificationId(policy.classificationId || 'DEFAULT');
    setInitialCredits(String(policy.initialCredits));
    setAccrualRate(String(policy.accrualRate));
    setMaxCarryover(policy.maxCarryover !== null ? String(policy.maxCarryover) : '');
    setFrequency(policy.frequency);
    setIsDialogOpen(true);
  };

  const handleDeleteOpen = (policy: BalancePolicy) => {
    setPolicyToDelete(policy);
    setDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!leaveTypeId) {
      showErrorToast('Leave type is required', 'Validation Error');
      return;
    }

    const payload = {
      leaveTypeId,
      classificationId: classificationId === 'DEFAULT' ? null : classificationId,
      initialCredits: parseFloat(initialCredits) || 0,
      accrualRate: parseFloat(accrualRate) || 0,
      maxCarryover: maxCarryover ? parseFloat(maxCarryover) : null,
      frequency,
    };

    if (selectedPolicy) {
      updatePolicyMutation.mutate({ ...payload, id: selectedPolicy.id });
    } else {
      createPolicyMutation.mutate(payload);
    }
  };

  const policies = policiesQuery.data?.data || [];
  const leaveTypes = leaveTypesQuery.data?.leaveTypes || [];
  const classifications = classificationsQuery.data?.data || [];

  const totalPages = Math.ceil(policies.length / itemsPerPage);
  const paginatedPolicies = policies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Balance Policies</h2>
          <p className="text-muted-foreground text-sm">Configure how balances are initialized and accrued</p>
        </div>
        <Button onClick={handleCreateOpen}>
          <Plus className="w-4 h-4 mr-2" />
          Add Policy
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Active Policies
          </CardTitle>
          <CardDescription>
            Policies defined per classification. "Default" applies if no specific classification policy exists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {policiesQuery.isLoading ? (
            <SkeletonTable rows={4} columns={6} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Initial Credits</TableHead>
                    <TableHead>Accrual Rate</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No balance policies defined.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPolicies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell className="font-medium">{policy.leaveType.name}</TableCell>
                        <TableCell>
                          <Badge variant={policy.classification ? "outline" : "secondary"}>
                            {policy.classification?.name || "Default"}
                          </Badge>
                        </TableCell>
                        <TableCell>{policy.initialCredits} days</TableCell>
                        <TableCell>{policy.accrualRate} days</TableCell>
                        <TableCell className="capitalize">{policy.frequency.toLowerCase()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditOpen(policy)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteOpen(policy)} className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
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
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPolicy ? 'Edit Policy' : 'Add Balance Policy'}</DialogTitle>
            <DialogDescription>
              Define credits and accrual rules for a leave type and classification.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Leave Type</label>
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId} disabled={!!selectedPolicy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Employee Classification</label>
              <Select value={classificationId} onValueChange={setClassificationId} disabled={!!selectedPolicy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFAULT">Default (Global)</SelectItem>
                  {classifications.map((cl) => (
                    <SelectItem key={cl.id} value={cl.id}>{cl.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Initial Credits</label>
                <Input type="number" value={initialCredits} onChange={(e) => setInitialCredits(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Accrual Rate</label>
                <Input type="number" value={accrualRate} onChange={(e) => setAccrualRate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Max Carryover</label>
                <Input type="number" value={maxCarryover} onChange={(e) => setMaxCarryover(e.target.value)} placeholder="No Limit" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Frequency</label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as AccrualScheme)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AccrualScheme.MONTHLY}>Monthly</SelectItem>
                    <SelectItem value={AccrualScheme.SEMESTER}>Semester</SelectItem>
                    <SelectItem value={AccrualScheme.ANNUAL}>Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={createPolicyMutation.isPending || updatePolicyMutation.isPending}
              className="text-white"
            >
              {selectedPolicy ? 'Update Policy' : 'Create Policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the balance policy for {policyToDelete?.leaveType.name} (
              {policyToDelete?.classification?.name || "Default"}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => policyToDelete && deletePolicyMutation.mutate(policyToDelete.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
