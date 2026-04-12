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
import { Plus, Search, Edit, Trash2, Mail, Briefcase } from 'lucide-react';
import { AccrualScheme } from '@prisma/client';

// Mock employee data
const mockEmployees = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'emp1@example.com',
    department: 'Engineering',
    designation: 'Senior Engineer',
    accrualScheme: 'MONTHLY' as AccrualScheme,
    hireDate: '2020-01-15',
    active: true,
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'emp2@example.com',
    department: 'Sales',
    designation: 'Sales Executive',
    accrualScheme: 'MONTHLY' as AccrualScheme,
    hireDate: '2021-06-01',
    active: true,
  },
  {
    id: '3',
    name: 'Carol White',
    email: 'emp3@example.com',
    department: 'Human Resources',
    designation: 'HR Manager',
    accrualScheme: 'ANNUAL' as AccrualScheme,
    hireDate: '2019-03-10',
    active: true,
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'emp4@example.com',
    department: 'Finance',
    designation: 'Finance Manager',
    accrualScheme: 'ANNUAL' as AccrualScheme,
    hireDate: '2018-07-20',
    active: true,
  },
  {
    id: '5',
    name: 'Eve Wilson',
    email: 'emp5@example.com',
    department: 'Marketing',
    designation: 'Marketing Lead',
    accrualScheme: 'MONTHLY' as AccrualScheme,
    hireDate: '2022-02-10',
    active: false,
  },
];

export default function EmployeesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<(typeof mockEmployees)[0] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const filteredEmployees = mockEmployees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (employee: (typeof mockEmployees)[0]) => {
    setSelectedEmployee(employee);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    alert(`Would delete employee ${id} (not implemented in demo)`);
  };

  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:ml-64">
          <div className="p-4 md:p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Employees</h1>
                <p className="text-muted-foreground mt-2">Manage your team members and their leave balances</p>
              </div>
              {user?.role === 'ADMIN' && (
                <Button onClick={handleAdd} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Employee
                </Button>
              )}
            </div>

            {/* Search */}
            <Card className="mb-6 border-border">
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-muted border-input"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Employees Table */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Employee Directory</CardTitle>
                <CardDescription>
                  {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
                </CardDescription>
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
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium text-foreground">{employee.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {employee.email}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{employee.department}</TableCell>
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
                              {user?.role === 'ADMIN' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(employee)}
                                  >
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
                ? `Update ${selectedEmployee?.name}'s information`
                : 'Create a new employee record'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input
                placeholder="Full name"
                defaultValue={selectedEmployee?.name}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                defaultValue={selectedEmployee?.email}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Department</label>
              <Input
                placeholder="Department"
                defaultValue={selectedEmployee?.department}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Designation</label>
              <Input
                placeholder="Job title"
                defaultValue={selectedEmployee?.designation}
                className="bg-muted border-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
