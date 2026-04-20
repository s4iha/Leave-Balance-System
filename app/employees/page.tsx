'use client';

import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Mail, Briefcase } from 'lucide-react';
import { AccrualScheme } from '@/generated/prisma/enums';
import { apiRequest, apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/sonner-toast';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface Employee {
  id: string;
  designation: string;
  accrualScheme: AccrualScheme;
  hireDate: string;
  active: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface EmployeeListResponse {
  employees: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

interface EmployeeFormData {
  name: string;
  email: string;
  department: string;
  designation: string;
  accrualScheme: AccrualScheme;
  hireDate: string;
  active: boolean;
}

const getDefaultFormData = (): EmployeeFormData => ({
  name: '',
  email: '',
  department: '',
  designation: '',
  accrualScheme: 'MONTHLY',
  hireDate: new Date().toISOString().split('T')[0],
  active: true,
});

export default function EmployeesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(getDefaultFormData());

  const canMutate = user?.role === 'ADMIN';
  const skip = (currentPage - 1) * itemsPerPage;
  const params = new URLSearchParams({
    skip: String(skip),
    take: String(itemsPerPage),
  });
  if (debouncedSearchTerm.trim()) params.set('search', debouncedSearchTerm.trim());
  const paramsString = params.toString();

  const employeesQuery = useQuery({
    queryKey: queryKeys.employees.list(paramsString),
    queryFn: () => apiRequestRaw<EmployeeListResponse>(`/api/v1/employees?${paramsString}`),
    enabled: Boolean(user && (user.role === 'ADMIN' || user.role === 'MANAGER')),
  });

  useEffect(() => {
    if (!employeesQuery.isError) return;
    console.error('Error fetching employees:', employeesQuery.error);
    toast({
      title: 'Error',
      description: 'Failed to load employees',
      variant: 'destructive',
    });
  }, [employeesQuery.error, employeesQuery.isError, toast]);

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequestRaw<{ message: string }>(`/api/v1/employees/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast({
        title: 'Employee Deleted',
        description: 'The employee has been successfully deleted.',
      });
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.list(paramsString) });
      queryClient.invalidateQueries({ queryKey: ['employees', 'list'], refetchType: 'none' });
    },
  });

  const upsertEmployeeMutation = useMutation({
    mutationFn: async (payload: EmployeeFormData & { id?: string }) => {
      const isUpdate = Boolean(payload.id);
      const path = isUpdate ? `/api/v1/employees/${payload.id}` : '/api/v1/employees';
      const method = isUpdate ? 'PUT' : 'POST';

      return apiRequest(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          department: payload.department,
          designation: payload.designation,
          accrualScheme: payload.accrualScheme,
          hireDate: payload.hireDate,
          active: payload.active,
        }),
      });
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.list(paramsString) });
      queryClient.invalidateQueries({ queryKey: ['employees', 'list'], refetchType: 'none' });
    },
  });

  const paginatedEmployees = employeesQuery.data?.employees || [];
  const totalCount = employeesQuery.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditMode(true);
    setFormData({
      name: employee.user.name,
      email: employee.user.email,
      department: employee.department?.name || '',
      designation: employee.designation,
      accrualScheme: employee.accrualScheme,
      hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : new Date().toISOString().split('T')[0],
      active: employee.active,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setIsEditMode(false);
    setFormData(getDefaultFormData());
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setEmployeeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteEmployeeMutation.isPending) return;
    if (!employeeToDelete) return;

    try {
      await deleteEmployeeMutation.mutateAsync(employeeToDelete);
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete employee.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveEmployee = async () => {
    if (upsertEmployeeMutation.isPending) return;
    if (!formData.name || !formData.email || !formData.department || !formData.designation || !formData.hireDate) {
      toast({
        title: 'Validation Error',
        description: 'Name, email, department, designation, and hire date are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isEditMode && selectedEmployee) {
        await upsertEmployeeMutation.mutateAsync({
          id: selectedEmployee.id,
          ...formData,
        });

        toast({
          title: 'Employee Updated',
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        await upsertEmployeeMutation.mutateAsync(formData);
        toast({
          title: 'Employee Created',
          description: `${formData.name} has been added successfully.`,
        });
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to save employee',
        variant: 'destructive',
      });
    }
  };

  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Employee Directory</h1>
                <p className="text-muted-foreground mt-2">Manage your team members and their leave balances</p>
              </div>
              {canMutate && (
                <Button onClick={handleAdd} className="gap-2 flex-shrink-0">
                  <Plus className="w-4 h-4" />
                  Add Employee
                </Button>
              )}
            </div>

            {/* Employees Table */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle>Employee List</CardTitle>
                    <CardDescription>
                      Showing {paginatedEmployees.length} of {totalCount} employee{totalCount !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto md:flex-none md:w-80">
                    <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <Input
                      placeholder="Search by name, email, or department..."
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
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Accrual Scheme</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeesQuery.isLoading && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Loading employees...
                          </TableCell>
                        </TableRow>
                      )}
                      {!employeesQuery.isLoading && paginatedEmployees.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No employees found.
                          </TableCell>
                        </TableRow>
                      )}
                      {paginatedEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium text-foreground">{employee.user.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {employee.user.email}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{employee.department?.name || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4" />
                              {employee.designation}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {employee.accrualScheme.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={employee.active ? 'default' : 'secondary'}>
                              {employee.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canMutate && (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(employee.id)}
                                    className="text-destructive hover:text-destructive"
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
          </div>
        </main>
      </div>

      {/* Employee Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? `Update ${selectedEmployee?.user.name}'s information`
                : 'Create a new employee record'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input
                placeholder="Full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Department</label>
              <Input
                placeholder="Department name or code"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Designation</label>
              <Input
                placeholder="Job title"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Accrual Scheme</label>
              <Select
                value={formData.accrualScheme}
                onValueChange={(value: AccrualScheme) => setFormData({ ...formData, accrualScheme: value })}
              >
                <SelectTrigger className="bg-muted border-input w-full">
                  <SelectValue placeholder="Select scheme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="SEMESTER">Semester</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Hire Date</label>
              <Input
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className="bg-muted border-input"
              />
            </div>
            {isEditMode && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select
                  value={formData.active ? 'true' : 'false'}
                  onValueChange={(value) => setFormData({ ...formData, active: value === 'true' })}
                >
                  <SelectTrigger className="bg-muted border-input w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEmployee} disabled={upsertEmployeeMutation.isPending}>
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteEmployeeMutation.isPending}
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
