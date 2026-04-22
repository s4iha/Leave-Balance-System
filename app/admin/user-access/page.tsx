'use client';

import { useState, useEffect } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Search, Edit, History, Shield } from 'lucide-react';
import { apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/sonner-toast';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  employee?: {
    id: string;
    name: string;
    active: boolean;
  };
  updatedAt: string;
}

interface RoleChangeHistory {
  id: string;
  timestamp: string;
  changedBy: string;
  oldRole: string;
  newRole: string;
  reason: string;
}

interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UserHistoryResponse {
  success: boolean;
  data: {
    history: RoleChangeHistory[];
  };
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-700 border-red-500/30',
  MANAGER: 'bg-orange-500/20 text-orange-700 border-orange-500/30',
  EMPLOYEE: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
};

export default function UserAccessPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [changeReason, setChangeReason] = useState('');
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [history, setHistory] = useState<RoleChangeHistory[]>([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      window.location.href = '/unauthorized';
    }
  }, [user]);

  const usersParams = new URLSearchParams({
    page: String(currentPage),
    limit: String(itemsPerPage),
  });
  if (debouncedSearchTerm.trim()) {
    usersParams.set('search', debouncedSearchTerm.trim());
  }
  if (roleFilter !== 'ALL') {
    usersParams.set('role', roleFilter);
  }
  if (statusFilter !== 'ALL') {
    usersParams.set('status', statusFilter);
  }
  const usersParamsString = usersParams.toString();

  const usersQuery = useQuery({
    queryKey: queryKeys.users.list(usersParamsString),
    queryFn: () => apiRequestRaw<UsersResponse>(`/api/v1/users?${usersParamsString}`),
    enabled: Boolean(user && user.role === 'ADMIN'),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!usersQuery.isError) return;
    toast({
      title: 'Error',
      description: 'Failed to fetch users',
      variant: 'destructive',
    });
  }, [toast, usersQuery.isError]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, roleFilter, statusFilter]);

  const handleEditRole = (user: User) => {
    if (user.id === user.id) {
      // Simple check - in real app, compare with logged-in user
      setSelectedUser(user);
      setNewRole(user.role);
      setChangeReason('');
      setIsRoleDialogOpen(true);
    }
  };

  const handleViewHistory = async (user: User) => {
    setHistoryUser(user);
    try {
      const data = await apiRequestRaw<UserHistoryResponse>(`/api/v1/users/${user.id}/history`);
      setHistory(data.data.history || []);
      setIsHistoryDialogOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch history',
        variant: 'destructive',
      });
    }
  };

  const roleChangeMutation = useMutation({
    mutationFn: (payload: { userId: string; newRole: string; reason: string }) =>
      apiRequestRaw(`/api/v1/users/${payload.userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newRole: payload.newRole,
          reason: payload.reason,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
    },
  });

  const handleConfirmRoleChange = async () => {
    if (roleChangeMutation.isPending) return;
    if (!selectedUser || !newRole || !changeReason) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (newRole === selectedUser.role) {
      toast({
        title: 'Error',
        description: 'New role must be different from current role',
        variant: 'destructive',
      });
      return;
    }

    try {
      await roleChangeMutation.mutateAsync({
        userId: selectedUser.id,
        newRole,
        reason: changeReason,
      });

      toast({
        title: 'Success',
        description: `${selectedUser.employee?.name}'s role has been updated to ${newRole}`,
      });
      setIsConfirmDialogOpen(false);
      setIsRoleDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const paginatedUsers = usersQuery.data?.data ?? [];
  const totalCount = usersQuery.data?.pagination.total ?? 0;
  const totalPages = Math.max(1, usersQuery.data?.pagination.totalPages ?? 1);

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
                  <Shield className="w-8 h-8 text-primary" />
                  User Access Management
                </h1>
                <p className="text-muted-foreground mt-2">Manage user roles and access permissions</p>
              </div>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6 border-border">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="flex gap-2">
                    <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <Input
                      placeholder="Search by email or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 bg-muted border-input"
                    />
                  </div>

                  {/* Role Filter */}
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="bg-muted border-input">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Roles</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-muted border-input">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Refresh Button */}
                  <Button
                    onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.users.list(usersParamsString) })}
                    variant="outline"
                    className="justify-center"
                  >
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Showing {paginatedUsers.length} of {totalCount} user{totalCount !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersQuery.isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                ) : paginatedUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No users found</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Modified</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedUsers.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium text-foreground">{u.email}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {u.employee?.name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`${roleColors[u.role]} border`}
                                  variant="outline"
                                >
                                  {u.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={u.employee?.active ? 'default' : 'secondary'}>
                                  {u.employee?.active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(u.updatedAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditRole(u)}
                                    className="gap-2"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Change Role
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewHistory(u)}
                                    className="gap-2"
                                  >
                                    <History className="w-4 h-4" />
                                    History
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
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.employee?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Current Email</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Current Role</p>
                <Badge className={`${roleColors[selectedUser.role]} border`}>
                  {selectedUser.role}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">New Role</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-2 bg-muted border-input">
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Reason for Change</label>
                <Textarea
                  placeholder="Explain why you're changing this user's role..."
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="mt-2 bg-muted border-input"
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-xs text-muted-foreground">
                  This action will be logged in the audit trail. Ensure you have a valid reason for this change.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsRoleDialogOpen(false);
                setIsConfirmDialogOpen(true);
              }}
              disabled={!newRole || !changeReason || newRole === selectedUser?.role}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {selectedUser?.employee?.name}'s role from{' '}
              <strong>{selectedUser?.role}</strong> to <strong>{newRole}</strong>?
              <br />
              <br />
              <strong>Reason:</strong> {changeReason}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRoleChange}
              disabled={roleChangeMutation.isPending}
              className="bg-primary"
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Role Change History</DialogTitle>
            <DialogDescription>
              Changes for {historyUser?.employee?.name} ({historyUser?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No role changes recorded
              </p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${roleColors[entry.oldRole]} border`}>
                        {entry.oldRole}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge className={`${roleColors[entry.newRole]} border`}>
                        {entry.newRole}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    <strong>Changed by:</strong> {entry.changedBy}
                  </p>
                  <p className="text-sm text-foreground">
                    <strong>Reason:</strong> {entry.reason}
                  </p>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
