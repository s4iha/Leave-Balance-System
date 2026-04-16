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
import { Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

// Mock leave type data
const mockLeaveTypes = [
  {
    id: '1',
    name: 'Paid Time Off (PTO)',
    description: 'General paid time off for vacation and personal reasons',
    maxDaysPerYear: 20,
    requiresApproval: true,
    carryoverAllowed: true,
    carryoverMaxDays: 5,
    active: true,
  },
  {
    id: '2',
    name: 'Sick Leave',
    description: 'Leave for illness and medical reasons',
    maxDaysPerYear: 10,
    requiresApproval: true,
    carryoverAllowed: false,
    carryoverMaxDays: null,
    active: true,
  },
  {
    id: '3',
    name: 'Casual Leave',
    description: 'Casual leave for personal reasons',
    maxDaysPerYear: 8,
    requiresApproval: false,
    carryoverAllowed: false,
    carryoverMaxDays: null,
    active: true,
  },
  {
    id: '4',
    name: 'Maternity Leave',
    description: 'Leave for maternity purposes',
    maxDaysPerYear: 90,
    requiresApproval: true,
    carryoverAllowed: false,
    carryoverMaxDays: null,
    active: true,
  },
  {
    id: '5',
    name: 'Bereavement Leave',
    description: 'Leave for family emergencies and bereavement',
    maxDaysPerYear: 3,
    requiresApproval: true,
    carryoverAllowed: false,
    carryoverMaxDays: null,
    active: false,
  },
];

export default function LeaveTypesPage() {
  const { user } = useAuth();
  const [selectedLeaveType, setSelectedLeaveType] = useState<(typeof mockLeaveTypes)[0] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleEdit = (leaveType: (typeof mockLeaveTypes)[0]) => {
    setSelectedLeaveType(leaveType);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedLeaveType(null);
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    alert(`Would delete leave type ${id} (not implemented in demo)`);
  };

  return (
    <ProtectedRoute requiredRoles={['ADMIN']}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
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
                  <div className="text-2xl font-bold text-foreground">{mockLeaveTypes.length}</div>
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
                    {mockLeaveTypes.filter((t) => t.active).length}
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
                    {mockLeaveTypes.filter((t) => t.requiresApproval).length}
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
                    {mockLeaveTypes.filter((t) => t.carryoverAllowed).length}
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
                      {mockLeaveTypes.map((leaveType) => (
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
                                {leaveType.carryoverMaxDays} days max
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
        </main>
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
                defaultValue={selectedLeaveType?.name}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input
                placeholder="Brief description of this leave type"
                defaultValue={selectedLeaveType?.description}
                className="bg-muted border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Max Days Per Year</label>
              <Input
                type="number"
                placeholder="20"
                defaultValue={selectedLeaveType?.maxDaysPerYear}
                className="bg-muted border-input"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-t border-border">
              <label className="text-sm font-medium text-foreground">Requires Approval</label>
              <Switch defaultChecked={selectedLeaveType?.requiresApproval} />
            </div>
            <div className="flex items-center justify-between py-3 border-t border-border">
              <label className="text-sm font-medium text-foreground">Allow Carryover</label>
              <Switch defaultChecked={selectedLeaveType?.carryoverAllowed} />
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
