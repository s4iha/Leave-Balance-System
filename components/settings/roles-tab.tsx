'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
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
  Edit,
  HelpCircle,
  Plus,
  Shield,
  Trash2,
  FileText,
  Users,
  ShieldCheck,
  Calendar,
  List,
  Settings,
  Building,
  Key,
  History,
  Lock
} from 'lucide-react';
import { RoleMatrixRow } from './role-matrix-row';
import { apiRequestRaw } from '@/lib/api-client';
import { toast, showErrorToast } from '@/lib/sonner-toast';
import { SkeletonTable } from '@/components/ui/skeleton';

interface Permission {
  id: string;
  action: string;
  resource: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isSystem: boolean;
  permissions: { permission: Permission }[];
  _count: { users: number };
}

interface RolePayload {
  name: string;
  description?: string;
  color?: string;
  permissions: string[];
}

const DEFAULT_ROLE_COLOR = '#7c3aed';

const RESOURCE_CONFIG: Record<string, { label: string; icon: any }> = {
  LEAVE_REQUEST: { label: 'Leave Requests', icon: FileText },
  USER: { label: 'Employees', icon: Users },
  ROLE: { label: 'Roles & Permissions', icon: ShieldCheck },
  HOLIDAY: { label: 'Holiday Calendar', icon: Calendar },
  LEAVE_TYPE: { label: 'Leave Types', icon: List },
  BALANCE_POLICY: { label: 'Balance Policies', icon: Settings },
  CLASSIFICATION: { label: 'Classifications', icon: Key },
  DEPARTMENT: { label: 'Departments', icon: Building },
  AUDIT_LOG: { label: 'Audit Logs', icon: History },
  SYSTEM_SETTING: { label: 'System Settings', icon: Lock },
};

function getRoleBadgeStyle(color: string | null | undefined) {
  const safeColor = color || DEFAULT_ROLE_COLOR;
  return {
    borderColor: `${safeColor}55`,
    backgroundColor: `${safeColor}1A`,
    color: safeColor,
  };
}

export function RolesTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [color, setColor] = useState(DEFAULT_ROLE_COLOR);

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiRequestRaw<{ success: boolean; data: Role[] }>('/api/v1/roles', {}, user?.id, user?.email),
  });

  const permissionsQuery = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiRequestRaw<{ success: boolean; data: Permission[] }>('/api/v1/permissions', {}, user?.id, user?.email),
  });

  const createRoleMutation = useMutation({
    mutationFn: (payload: RolePayload) =>
      apiRequestRaw('/api/v1/roles', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, user?.id, user?.email),
    onSuccess: () => {
      toast({ title: 'Role created successfully' });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      showErrorToast(error, 'Failed to create role');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (payload: RolePayload & { id: string }) =>
      apiRequestRaw(`/api/v1/roles/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }, user?.id, user?.email),
    onSuccess: () => {
      toast({ title: 'Role updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      showErrorToast(error, 'Failed to update role');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequestRaw(`/api/v1/roles/${id}`, {
        method: 'DELETE',
      }, user?.id, user?.email),
    onSuccess: () => {
      toast({ title: 'Role deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    },
    onError: (error: Error) => {
      showErrorToast(error, 'Failed to delete role');
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedPermissions([]);
    setColor(DEFAULT_ROLE_COLOR);
    setSelectedRole(null);
  };

  const handleCreateOpen = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditOpen = (role: Role) => {
    setSelectedRole(role);
    setName(role.name);
    setDescription(role.description || '');
    setColor(role.color || DEFAULT_ROLE_COLOR);
    setSelectedPermissions(role.permissions.map((permission) => permission.permission.id));
    setIsDialogOpen(true);
  };

  const handleDeleteOpen = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions((previous) =>
      previous.includes(id) ? previous.filter((permissionId) => permissionId !== id) : [...previous, id]
    );
  };

  const isSubmitting = createRoleMutation.isPending || updateRoleMutation.isPending;
  const roles = rolesQuery.data?.data || [];
  const permissions = permissionsQuery.data?.data || [];
  const isEditMode = Boolean(selectedRole);
  const sortedPermissions = useMemo(
    () => [...permissions].sort((a, b) => `${a.resource}:${a.action}`.localeCompare(`${b.resource}:${b.action}`)),
    [permissions]
  );

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};

    permissions.forEach(p => {
      if (!groups[p.resource]) groups[p.resource] = [];
      groups[p.resource].push(p);
    });

    return Object.entries(groups).sort(([a], [b]) => {
      const order = Object.keys(RESOURCE_CONFIG);
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [permissions]);

  const hasOtherPermissions = useMemo(() => {
    const standardActions = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'MANAGE'];
    return permissions.some(p => !standardActions.includes(p.action));
  }, [permissions]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showErrorToast('Role name is required', 'Validation error');
      return;
    }

    const payload: RolePayload = {
      name: trimmedName,
      description: description.trim(),
      color,
      permissions: selectedPermissions,
    };

    if (isEditMode && selectedRole) {
      updateRoleMutation.mutate({ ...payload, id: selectedRole.id });
      return;
    }

    createRoleMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Roles & Permissions</h2>
          <p className="text-muted-foreground text-sm">Manage dynamic access roles for the system</p>
        </div>
        <Button onClick={handleCreateOpen}>
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Defined Roles
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={() => setIsHelpModalOpen(true)}
              title="Permissions Help"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Review role access, user assignments, and permission mappings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rolesQuery.isLoading ? (
            <SkeletonTable rows={4} columns={5} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right w-[80px]">Users</TableHead>
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id} className="hover:bg-muted/50">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" style={getRoleBadgeStyle(role.color)} className="font-medium">
                            {role.name}
                          </Badge>
                          {role.isSystem && (
                            <Badge variant="secondary" className="text-[10px] h-5">System</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3">
                        {role.description || '-'}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-wrap gap-1 max-w-[380px]">
                          {role.permissions.slice(0, 4).map((permission) => (
                            <Badge key={permission.permission.id} variant="outline" className="text-[10px] bg-background">
                              {permission.permission.action}:{permission.permission.resource}
                            </Badge>
                          ))}
                          {role.permissions.length > 4 && (
                            <Badge variant="outline" className="text-[10px] bg-background text-muted-foreground">
                              +{role.permissions.length - 4} more
                            </Badge>
                          )}
                          {role.permissions.length === 0 && (
                            <span className="text-xs text-muted-foreground">No permissions</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3">{role._count.users}</TableCell>
                      <TableCell className="text-right py-3">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditOpen(role)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={role.isSystem || role._count.users > 0}
                            onClick={() => handleDeleteOpen(role)}
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[1200px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Role' : 'Create Custom Role'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update role details and permission mappings.'
                : 'Define a new role and assign its system permissions.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Role Name</label>
                <Input
                  className="bg-muted/60"
                  placeholder="e.g. HR Officer"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role Color</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="w-16 p-1 h-10"
                  />
                  <Input
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    placeholder="#7c3aed"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Role description..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Assign Permissions
              </label>
              <div className="rounded-xl border border-border overflow-x-auto bg-background/50">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[240px]">Resource</TableHead>
                      <TableHead className="text-center">View</TableHead>
                      <TableHead className="text-center">Create</TableHead>
                      <TableHead className="text-center">Edit</TableHead>
                      <TableHead className="text-center">Delete</TableHead>
                      <TableHead className="text-center">Approve</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedPermissions.map(([resource, actions]) => {
                      const config = RESOURCE_CONFIG[resource] || { label: resource, icon: Shield };
                      return (
                        <RoleMatrixRow
                          key={resource}
                          resource={resource}
                          label={config.label}
                          icon={config.icon}
                          availableActions={actions}
                          selectedPermissionIds={selectedPermissions}
                          onToggle={togglePermission}
                          showOtherColumn={false}
                        />
                      );
                    })}
                    {groupedPermissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No permissions available to assign.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={isSubmitting || !name.trim()}
              className="text-white"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role</AlertDialogTitle>
            <AlertDialogDescription>
              {roleToDelete?.isSystem
                ? 'System roles cannot be deleted.'
                : roleToDelete && roleToDelete._count.users > 0
                  ? 'This role has active users and cannot be deleted.'
                  : `This will permanently remove the "${roleToDelete?.name}" role.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => roleToDelete && deleteRoleMutation.mutate(roleToDelete.id)}
              disabled={!roleToDelete || roleToDelete.isSystem || roleToDelete._count.users > 0 || deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permissions Help Modal */}
      <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
        <DialogContent className="w-[92vw] sm:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Permissions Glossary
            </DialogTitle>
            <DialogDescription>
              A guide to understanding what each system permission enables.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[180px]">Permission</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { action: 'APPROVE', resource: 'LEAVE_REQUEST', description: 'Allows approving or rejecting leave requests from subordinates.' },
                    { action: 'CREATE', resource: 'LEAVE_REQUEST', description: 'Allows submitting new leave requests for themselves.' },
                    { action: 'MANAGE', resource: 'USER', description: 'Allows creating, editing, and managing employee profiles and system users.' },
                    { action: 'MANAGE', resource: 'ROLE', description: 'Allows creating and modifying system roles and permission mappings.' },
                    { action: 'MANAGE', resource: 'HOLIDAY', description: 'Allows defining system-wide holidays and observances.' },
                    { action: 'READ', resource: 'LEAVE_TYPE', description: 'Allows viewing available leave types and their configurations.' },
                    { action: 'MANAGE', resource: 'LEAVE_TYPE', description: 'Allows full administrative control over leave types (Create/Edit/Delete).' },
                    { action: 'MANAGE', resource: 'DEPARTMENT', description: 'Allows managing university departments and organizational structure.' },
                    { action: 'MANAGE', resource: 'CLASSIFICATION', description: 'Allows managing employee classifications (e.g. Regular, Contractual).' },
                    { action: 'MANAGE', resource: 'BALANCE_POLICY', description: 'Allows configuring leave accrual rules and policy mappings.' },
                    { action: 'MANAGE', resource: 'SYSTEM_SETTING', description: 'Allows modifying global system configurations and business rules.' },
                  ].map((item) => (
                    <TableRow key={`${item.action}:${item.resource}`}>
                      <TableCell className="font-mono text-xs">
                        <Badge variant="outline" className="font-semibold text-[10px] py-0">
                          {item.action}:{item.resource}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Special Badge: System
              </h4>
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                <p>
                  The <Badge variant="secondary" className="mx-1">System</Badge> badge indicates a **Predefined Role** (Admin, Manager, Employee).
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>These roles are built-in and serve as the core framework for system operations.</li>
                  <li>They **cannot be deleted** to ensure system stability and baseline access.</li>
                  <li>Permissions for these roles can still be modified, but the role itself is permanent.</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHelpModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
