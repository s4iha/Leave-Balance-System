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
import { Plus, Search, Edit, Trash2, Mail, Briefcase, FileDown, Upload, Calendar, AlertCircle } from 'lucide-react';
import { AccrualScheme, Gender } from '@/generated/prisma/enums';
import { apiRequest, apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { toast, showErrorToast } from '@/lib/sonner-toast';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkeletonCard } from '@/components/ui/skeleton';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useSidebarLayout } from '@/components/layout/sidebar-context';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

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
  classification: {
    id: string;
    name: string;
  } | null;
  employeeNumber: string;
  workHoursPerDay: number;
  manager: {
    id: string;
    name: string;
    email: string;
  } | null;
  gender: Gender | null;
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
  classificationId: string;
  employeeNumber: string;
  workHoursPerDay: number;
  managerId: string;
  gender: Gender | '';
}

const getDefaultFormData = (): EmployeeFormData => ({
  name: '',
  email: '',
  department: '',
  designation: '',
  accrualScheme: 'MONTHLY',
  hireDate: '',
  active: true,
  classificationId: '',
  employeeNumber: '',
  workHoursPerDay: 8,
  managerId: '',
  gender: '',
});

export default function EmployeesPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebarLayout();
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(getDefaultFormData());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!formData.hireDate) {
      setFormData((current) => ({
        ...current,
        hireDate: new Date().toISOString().split('T')[0],
      }));
    }
  }, [formData.hireDate]);

  const canMutate = user?.permissions?.some(p => p.action === 'MANAGE' && p.resource === 'USER') || user?.role === 'System Admin';
  const skip = (currentPage - 1) * itemsPerPage;
  const params = new URLSearchParams({
    skip: String(skip),
    take: String(itemsPerPage),
    active: 'true',
  });
  if (debouncedSearchTerm.trim()) params.set('search', debouncedSearchTerm.trim());
  const paramsString = params.toString();

  const employeesQuery = useQuery({
    queryKey: queryKeys.employees.list(paramsString),
    queryFn: () => apiRequestRaw<EmployeeListResponse>(`/api/v1/employees?${paramsString}`, undefined, user?.id, user?.email),
    enabled: Boolean(user && (user.role === 'System Admin' || user.role === 'Manager')),
  });

  const departmentsQuery = useQuery({
    queryKey: queryKeys.departments.list('active=true'),
    queryFn: () => apiRequestRaw<{ data: { id: string, name: string, active: boolean }[] }>('/api/v1/departments?active=true', undefined, user?.id, user?.email),
    enabled: Boolean(user && user.permissions?.some(p => p.action === 'MANAGE' && p.resource === 'USER')),
  });

  const departments = departmentsQuery.data?.data?.filter(d => d.active) || [];

  const balancesQuery = useQuery({
    queryKey: ['balances', selectedEmployee?.id],
    queryFn: () => apiRequestRaw<any[]>(`/api/v1/balances?employeeId=${selectedEmployee?.id}`, undefined, user?.id, user?.email),
    enabled: !!selectedEmployee?.id && isDialogOpen,
    staleTime: 5 * 60 * 1000,
  });

  const classificationsQuery = useQuery({
    queryKey: ['classifications', 'active'],
    queryFn: () => apiRequestRaw<{ data: { id: string, name: string, active: boolean }[] }>('/api/v1/classifications?activeOnly=true', undefined, user?.id, user?.email),
    enabled: Boolean(user && user.permissions?.some(p => p.action === 'MANAGE' && p.resource === 'USER')),
  });

  const classifications = classificationsQuery.data?.data || [];

  const managersQuery = useQuery({
    queryKey: ['managers'],
    queryFn: () => apiRequestRaw<{ data: { id: string, name: string, email: string }[] }>('/api/v1/users?role=Manager&role=System Admin', undefined, user?.id, user?.email),
    enabled: Boolean(user && user.permissions?.some(p => p.action === 'MANAGE' && p.resource === 'USER')),
  });

  const managers = managersQuery.data?.data || [];

  useEffect(() => {
    if (!employeesQuery.isError) return;
    console.error('Error fetching employees:', employeesQuery.error);
    showErrorToast(employeesQuery.error, 'Failed to load employees');
  }, [employeesQuery.error, employeesQuery.isError, toast]);

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequestRaw<{ message: string }>(`/api/v1/employees/${id}`, {
        method: 'DELETE',
      }, user?.id, user?.email),
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
          classificationId: payload.classificationId,
          employeeNumber: payload.employeeNumber || null,
          workHoursPerDay: payload.workHoursPerDay || 8,
          managerId: payload.managerId || null,
          gender: payload.gender || null,
        }),
      }, user?.id, user?.email);
    },
    onSuccess: (data: any) => {
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.list(paramsString) });
      queryClient.invalidateQueries({ queryKey: ['employees', 'list'], refetchType: 'none' });

    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: (employees: any[]) =>
      apiRequestRaw<{ success: boolean, count: number, failed: any[] }>('/api/v1/employees/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees }),
      }, user?.id, user?.email),
    onSuccess: (data: any) => {
      setIsBulkDialogOpen(false);
      setBulkData('');
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.list(paramsString) });

      if (data.failed && data.failed.length > 0) {
        toast({
          title: 'Import Completed with Errors',
          description: `Imported ${data.count} employees. ${data.failed.length} failed.`,
          variant: 'warning' as any,
        });
      } else if (data.count > 0) {
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${data.count} employees. Credentials were emailed to each employee.`,
        });
      }
    },
    onError: (error) => {
      showErrorToast(error, 'Import Failed');
    }
  });

  const handleBulkImport = async () => {
    if (!bulkData.trim()) return;
    setIsImporting(true);

    try {
      // Basic CSV/TSV parsing
      const lines = bulkData.trim().split('\n');
      const employees = lines.map(line => {
        const [name, email, department, designation, scheme, date] = line.split(/[,\t]/).map(s => s.trim());
        return {
          name,
          email,
          department,
          designation,
          accrualScheme: scheme || 'MONTHLY',
          hireDate: date || new Date().toISOString().split('T')[0]
        };
      }).filter(emp => emp.name && emp.email);

      if (employees.length === 0) {
        showErrorToast('No valid employee data found to import.', 'No Data');
        return;
      }

      await bulkImportMutation.mutateAsync(employees);
    } catch (error) {
      console.error('Parsing error:', error);
      showErrorToast(error, 'Parsing Error');
    } finally {
      setIsImporting(false);
    }
  };

  const paginatedEmployees = employeesQuery.data?.employees || [];
  const totalCount = employeesQuery.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditMode(true);
    setFormData({
      name: employee.user.name,
      email: employee.user.email,
      department: employee.department?.id || '',
      designation: employee.designation,
      accrualScheme: employee.accrualScheme,
      hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : new Date().toISOString().split('T')[0],
      active: employee.active,
      classificationId: employee.classification?.id || '',
      employeeNumber: employee.employeeNumber || '',
      workHoursPerDay: employee.workHoursPerDay || 8,
      managerId: employee.manager?.id || '',
      gender: employee.gender || '',
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
      showErrorToast(error, 'Failed to delete employee');
    }
  };

  const handleSaveEmployee = async () => {
    if (upsertEmployeeMutation.isPending) return;
    if (!formData.name || !formData.email || !formData.department || !formData.designation || !formData.hireDate) {
      showErrorToast('Name, email, department, designation, and hire date are required', 'Validation Error');
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
          description: `${formData.name} has been added successfully. Credentials were emailed.`,
        });
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      showErrorToast(error, 'Failed to save employee');
    }
  };

  // Prevent hydration mismatch by only rendering once mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={[{ action: 'MANAGE', resource: 'USER' }]}>
      <div className="flex h-screen bg-background">
        <MobileHeader />
        <Sidebar />
        <MainContent>
          <div className={cn("pt-4 pr-4 pb-4 pl-4 md:pt-8 md:pr-8 md:pb-8", isCollapsed ? "md:px-8" : "md:px-8", "max-w-8xl mx-auto")}>
            {/* Header */}
            <div className="flex justify-between items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Employee Directory</h1>
                <p className="text-muted-foreground mt-2">Manage your team members and their leave balances</p>
              </div>
              {canMutate && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)} className="gap-2 flex-shrink-0">
                    <Upload className="w-4 h-4" />
                    Bulk Import
                  </Button>
                  <Button onClick={handleAdd} className="gap-2 flex-shrink-0">
                    <Plus className="w-4 h-4" />
                    Add Employee
                  </Button>
                </div>
              )}
            </div>

            {/* Employees Table */}
            <Card className="border-border">
              <CardHeader className="pb-4">
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                  <div className="space-y-1.5">
                    <CardTitle className="text-xl">Employee List</CardTitle>
                    <CardDescription>
                      Showing {paginatedEmployees.length} of {totalCount} employee{totalCount !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <div className="relative w-full md:w-[320px] group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Search by name, email, or department..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-muted/50 border-border/50 pl-10 h-11 focus:bg-background transition-all"
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
                        <TableHead>Classification</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeesQuery.isLoading && (
                        <TableRow>
                          <TableCell colSpan={9} className="p-0 border-0">
                            <SkeletonTable rows={3} columns={9} className="p-4" />
                          </TableCell>
                        </TableRow>
                      )}
                      {!employeesQuery.isLoading && paginatedEmployees.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
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
                            {employee.classification ? (
                              <Badge variant="secondary" className="font-normal">
                                {employee.classification.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {employee.manager ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{employee.manager.name}</span>
                                <span className="text-xs text-muted-foreground">{employee.manager.email}</span>
                              </div>
                            ) : (
                              <span className="text-xs italic">No Manager</span>
                            )}
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
          </div>
        </MainContent>
      </div>

      {/* Employee Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-[750px] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? `Update ${selectedEmployee?.user.name}'s information`
                : 'Create a new employee record'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="details" className="h-full flex flex-col">
              <div className="px-6 border-b border-border">
                <TabsList className="w-full justify-start h-12 bg-transparent gap-6 p-0">
                  <TabsTrigger 
                    value="details" 
                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 font-semibold transition-all"
                  >
                    Employee Details
                  </TabsTrigger>
                  {isEditMode && (
                    <TabsTrigger 
                      value="balances" 
                      className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 font-semibold transition-all"
                    >
                      Leave Balances
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="details" className="m-0 p-6 space-y-6">
                  <div className="space-y-8">
                    {/* Section: Personal Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Personal Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Full Name</label>
                          <Input
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-muted/50 border-border/50 h-11 focus:bg-background transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Email Address</label>
                          <Input
                            type="email"
                            placeholder="john.doe@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-muted/50 border-border/50 h-11 focus:bg-background transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Employee Number</label>
                          <Input
                            placeholder="EMP-001"
                            value={formData.employeeNumber}
                            onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                            className="bg-muted/50 border-border/50 h-11 focus:bg-background transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Gender</label>
                          <Select
                            value={formData.gender}
                            onValueChange={(value: Gender) => setFormData({ ...formData, gender: value })}
                          >
                            <SelectTrigger className="bg-muted/50 border-border/50 h-11 focus:bg-background transition-all">
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE">Male</SelectItem>
                              <SelectItem value="FEMALE">Female</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                              <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Section: Organization */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Organization & Role</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Department</label>
                          <Select
                            value={formData.department}
                            onValueChange={(value) => setFormData({ ...formData, department: value })}
                          >
                            <SelectTrigger className="bg-muted/50 border-border/50 h-11 focus:bg-background transition-all">
                              <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground">No active departments found</div>
                              ) : (
                                departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Job Title / Designation</label>
                          <Input
                            placeholder="Senior Developer"
                            value={formData.designation}
                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                            className="bg-muted/50 border-border/50 h-11 focus:bg-background transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Classification</label>
                          <Select
                            value={formData.classificationId}
                            onValueChange={(value) => setFormData({ ...formData, classificationId: value })}
                          >
                            <SelectTrigger className="bg-muted/50 border-border/50 h-11 focus:bg-background transition-all">
                              <SelectValue placeholder="Select Classification" />
                            </SelectTrigger>
                            <SelectContent>
                              {classifications.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground">No active classifications found</div>
                              ) : (
                                classifications.map((cls) => (
                                  <SelectItem key={cls.id} value={cls.id}>
                                    {cls.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Direct Manager</label>
                          <Select
                            value={formData.managerId}
                            onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                          >
                            <SelectTrigger className="bg-muted/50 border-border/50 h-11 focus:bg-background transition-all">
                              <SelectValue placeholder="Select Manager" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None (Self-Managed)</SelectItem>
                              {managers.map((mgr) => (
                                <SelectItem key={mgr.id} value={mgr.id}>
                                  {mgr.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Section: Employment Policy */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Employment & Policy</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Hire Date</label>
                          <Input
                            type="date"
                            value={formData.hireDate}
                            onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                            className="bg-muted/50 border-border/50 h-11 focus:bg-background transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Work Hours per Day</label>
                          <Input
                            type="number"
                            min="1"
                            max="24"
                            step="0.5"
                            value={formData.workHoursPerDay}
                            onChange={(e) => setFormData({ ...formData, workHoursPerDay: parseFloat(e.target.value) })}
                            className="bg-muted/50 border-border/50 h-11 focus:bg-background transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Accrual Scheme</label>
                          <Select
                            value={formData.accrualScheme}
                            onValueChange={(value: AccrualScheme) => setFormData({ ...formData, accrualScheme: value })}
                          >
                            <SelectTrigger className="bg-muted/50 border-border/50 h-11 focus:bg-background transition-all">
                              <SelectValue placeholder="Select Accrual Scheme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MONTHLY">Monthly Accrual</SelectItem>
                              <SelectItem value="SEMESTER">Semester Accrual</SelectItem>
                              <SelectItem value="ANNUAL">Annual Accrual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {isEditMode && (
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Employment Status</label>
                            <Select
                              value={formData.active ? 'true' : 'false'}
                              onValueChange={(value) => setFormData({ ...formData, active: value === 'true' })}
                            >
                              <SelectTrigger className="bg-muted/50 border-border/50 h-11 focus:bg-background transition-all">
                                <SelectValue placeholder="Select Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Inactive / Terminated</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {isEditMode && (
                  <TabsContent value="balances" className="m-0 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground">Current Year Balances</h3>
                      <Badge variant="outline" className="font-semibold">{new Date().getFullYear()}</Badge>
                    </div>

                    {balancesQuery.isLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SkeletonCard className="h-28" />
                        <SkeletonCard className="h-28" />
                      </div>
                    ) : (balancesQuery.data?.length ?? 0) === 0 ? (
                      <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-muted/30 border border-dashed border-border text-center">
                        <AlertCircle className="w-8 h-8 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground font-medium">No leave balances found</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                          Ensure the employee is assigned to an accrual scheme to see balances here.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {balancesQuery.data?.map((balance: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{balance.leaveType.name}</span>
                              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <Calendar className="w-3.5 h-3.5" />
                              </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl font-bold text-foreground">{balance.closingBalance}</span>
                              <span className="text-xs text-muted-foreground">/ {balance.leaveType.maxDaysPerYear} days</span>
                            </div>
                            <div className="mt-3 h-1 w-full bg-border rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all" 
                                style={{ width: `${Math.min(100, (balance.closingBalance / balance.leaveType.maxDaysPerYear) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEmployee}
              disabled={upsertEmployeeMutation.isPending}
              className="text-white"
            >
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

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className='pb-4'>Bulk Employee Import</DialogTitle>
            <DialogDescription>
              Paste employee data below. Format: <code className="bg-muted px-1 rounded">Name, Email, Department, Designation, [Accrual Scheme], [Hire Date]</code>
              <br />
              One employee per line. Department can be name or code.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Textarea
              placeholder="John Doe, john@example.com, Engineering, Senior Dev, MONTHLY, 2024-01-01"
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkImport} disabled={isImporting || bulkImportMutation.isPending}>
              {isImporting ? 'Importing...' : 'Start Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </ProtectedRoute>
  );
}
