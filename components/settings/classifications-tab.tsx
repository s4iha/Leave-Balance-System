'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { apiRequestRaw } from '@/lib/api-client';
import { toast, showErrorToast } from '@/lib/sonner-toast';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Classification {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  _count?: {
    employees: number;
  };
}

interface ClassificationListResponse {
  success: boolean;
  data: Classification[];
  pagination: {
    total: number;
    skip: number;
    take: number;
    pages: number;
  };
}

export function ClassificationsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClassification, setSelectedClassification] = useState<Classification | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classificationToDelete, setClassificationToDelete] = useState<Classification | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const skip = (currentPage - 1) * itemsPerPage;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
  });

  const canManage = Boolean(
    user &&
    (user.role === 'System Admin' ||
      user.permissions?.some(p => p.action === 'MANAGE' && p.resource === 'SYSTEM_SETTING'))
  );

  const { data, isLoading } = useQuery({
    queryKey: ['classifications', search, skip],
    queryFn: () => apiRequestRaw<ClassificationListResponse>(`/api/v1/classifications?search=${search}&skip=${skip}&take=${itemsPerPage}`, undefined, user?.id, user?.email),
  });

  const classifications = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: typeof formData) =>
      apiRequestRaw<any>('/api/v1/classifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, user?.id, user?.email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classifications'] });
      toast({ title: 'Success', description: 'Classification created successfully' });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      showErrorToast(error, 'Failed to create classification');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: typeof formData & { id: string }) =>
      apiRequestRaw<any>(`/api/v1/classifications/${payload.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, user?.id, user?.email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classifications'] });
      toast({ title: 'Success', description: 'Classification updated successfully' });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      showErrorToast(error, 'Failed to update classification');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequestRaw<any>(`/api/v1/classifications/${id}`, {
        method: 'DELETE',
      }, user?.id, user?.email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classifications'] });
      toast({ title: 'Success', description: 'Classification deleted successfully' });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      showErrorToast(error, 'Failed to delete classification');
    },
  });

  const handleAdd = () => {
    setSelectedClassification(null);
    setFormData({ name: '', description: '', active: true });
    setIsDialogOpen(true);
  };

  const handleEdit = (classification: Classification) => {
    setSelectedClassification(classification);
    setFormData({
      name: classification.name,
      description: classification.description || '',
      active: classification.active,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (classification: Classification) => {
    setClassificationToDelete(classification);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      showErrorToast('Name is required', 'Validation Error');
      return;
    }

    if (selectedClassification) {
      updateMutation.mutate({ ...formData, id: selectedClassification.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Employee Classifications</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage employee categories like Regular, Contractual, etc.
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2" disabled={!canManage}>
          <Plus className="w-4 h-4" />
          Add Classification
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Classifications</h3>
            </div>
            <div className="relative w-full md:w-[320px] group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search classifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-muted/50 border-border/50 pl-10 h-11 focus:bg-background transition-all"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable rows={5} columns={5} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No classifications found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      classifications.map((classification) => (
                        <TableRow key={classification.id}>
                          <TableCell className="font-medium text-foreground">
                            {classification.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">
                            {classification.description || 'No description'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {classification._count?.employees || 0} Employees
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={classification.active ? 'default' : 'secondary'}>
                              {classification.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(classification)}
                                disabled={!canManage}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(classification)}
                                disabled={!canManage || (classification._count?.employees || 0) > 0}
                                className="text-destructive hover:text-destructive"
                              >
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

              {/* Pagination */}
              {data?.pagination && data.pagination.pages > 1 && (
                <div className="mt-6">
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

                      {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((page) => (
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
                            if (currentPage < data.pagination.pages) setCurrentPage(currentPage + 1);
                          }}
                          className={currentPage === data.pagination.pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedClassification ? 'Edit Classification' : 'Add Classification'}</DialogTitle>
            <DialogDescription>
              Configure employee classification details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g., Regular, Contractual"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Brief description of this classification"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked as boolean }))}
              />
              <label htmlFor="active" className="text-sm font-medium">Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="text-white"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedClassification ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Classification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{classificationToDelete?.name}" classification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => classificationToDelete && deleteMutation.mutate(classificationToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
