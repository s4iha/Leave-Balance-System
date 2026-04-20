'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import { apiRequest, apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/sonner-toast';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  managerId: string | null;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    employees: number;
  };
}

interface DepartmentListResponse {
  success: boolean;
  data: Department[];
  pagination?: {
    total?: number;
    pages?: number;
  };
}

export default function DepartmentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const skip = (currentPage - 1) * itemsPerPage;
  const params = new URLSearchParams({
    skip: String(skip),
    take: String(itemsPerPage),
  });
  if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
  const paramsString = params.toString();

  const departmentsQuery = useQuery({
    queryKey: queryKeys.departments.list(paramsString),
    queryFn: () => apiRequestRaw<DepartmentListResponse>(`/api/v1/departments?${paramsString}`),
    enabled: Boolean(user && user.role === 'ADMIN'),
  });

  useEffect(() => {
    if (!departmentsQuery.isError) return;
    console.error('Error fetching departments:', departmentsQuery.error);
    toast({
      title: 'Error',
      description: 'Failed to load departments',
      variant: 'destructive',
    });
  }, [departmentsQuery.error, departmentsQuery.isError, toast]);

  const deleteDepartmentMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequestRaw<{ success: boolean; message?: string }>(`/api/v1/departments/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast({
        title: 'Department Deleted',
        description: 'The department has been deleted successfully.',
      });
      setDeleteConfirmOpen(false);
      setDepartmentToDelete(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.list(paramsString) });
      queryClient.invalidateQueries({ queryKey: ['departments', 'list'], refetchType: 'none' });
    },
  });

  const upsertDepartmentMutation = useMutation({
    mutationFn: async (payload: { id?: string; name: string; code: string; description: string | null }) => {
      const isUpdate = Boolean(payload.id);
      const path = isUpdate ? `/api/v1/departments/${payload.id}` : '/api/v1/departments';
      const method = isUpdate ? 'PUT' : 'POST';

      return apiRequest(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          code: payload.code,
          description: payload.description,
        }),
      });
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.list(paramsString) });
      queryClient.invalidateQueries({ queryKey: ['departments', 'list'], refetchType: 'none' });
    },
  });

  const paginatedDepartments = departmentsQuery.data?.data || [];
  const totalPages = departmentsQuery.data?.pagination?.pages || 1;
  const totalCount = departmentsQuery.data?.pagination?.total || 0;

  const handleAdd = () => {
    setIsEditMode(false);
    setFormData({ name: '', code: '', description: '' });
    setSelectedDepartment(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (department: Department) => {
    setIsEditMode(true);
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const dept = paginatedDepartments.find((d) => d.id === id);
    if (dept && dept._count && dept._count.employees > 0) {
      toast({
        title: 'Cannot Delete',
        description: `This department has ${dept._count.employees} employees. Please reassign them first.`,
        variant: 'destructive',
      });
      return;
    }
    setDepartmentToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteDepartmentMutation.isPending) return;
    if (!departmentToDelete) return;
    try {
      await deleteDepartmentMutation.mutateAsync(departmentToDelete);
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete department.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveDepartment = async () => {
    if (upsertDepartmentMutation.isPending) return;
    if (!formData.name || !formData.code) {
      toast({
        title: 'Validation Error',
        description: 'Name and code are required',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate code
    const isDuplicateCode = paginatedDepartments.some(
      (d) => d.code === formData.code && (!isEditMode || d.id !== selectedDepartment?.id)
    );

    if (isDuplicateCode) {
      toast({
        title: 'Validation Error',
        description: 'Department code already exists',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isEditMode && selectedDepartment) {
        await upsertDepartmentMutation.mutateAsync({
          id: selectedDepartment.id,
          name: formData.name,
          code: formData.code,
          description: formData.description || null,
        });

        toast({
          title: 'Department Updated',
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        await upsertDepartmentMutation.mutateAsync({
          name: formData.name,
          code: formData.code,
          description: formData.description || null,
        });

        toast({
          title: 'Department Created',
          description: `${formData.name} has been created successfully.`,
        });
      }

    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        title: 'Error',
        description: 'Failed to save department',
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
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-8 h-8 text-primary" />
                  Departments
                </h1>
                <p className="text-muted-foreground mt-2">Manage organizational departments</p>
              </div>
              <Button onClick={handleAdd} className="gap-2 flex-shrink-0">
                <Plus className="w-4 h-4" />
                Add Department
              </Button>
            </div>

            {/* Departments Table */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle>Department List</CardTitle>
                    <CardDescription>
                      Showing {paginatedDepartments.length} of {totalCount} department
                      {totalCount !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto md:flex-none md:w-80">
                    <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <Input
                      placeholder="Search by name or code..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="flex-1 bg-muted border-input"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Employee Count</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departmentsQuery.isLoading && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Loading departments...
                          </TableCell>
                        </TableRow>
                      )}
                      {paginatedDepartments.map((department) => (
                        <TableRow key={department.id}>
                          <TableCell className="font-medium text-foreground">{department.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{department.code}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {department.description || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{department._count?.employees || 0}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(department)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(department.id)}
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dialog for Add/Edit */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isEditMode ? 'Edit Department' : 'Add New Department'}</DialogTitle>
                  <DialogDescription>
                    {isEditMode
                      ? 'Update department information'
                      : 'Create a new department for your organization'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Department Name</label>
                    <Input
                      placeholder="e.g., Human Resources"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-2 bg-muted border-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Department Code</label>
                    <Input
                      placeholder="e.g., HR"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="mt-2 bg-muted border-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Description (Optional)</label>
                    <Input
                      placeholder="Brief description of the department"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-2 bg-muted border-input"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveDepartment} disabled={upsertDepartmentMutation.isPending}>
                    {isEditMode ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Department</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this department? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    disabled={deleteDepartmentMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
