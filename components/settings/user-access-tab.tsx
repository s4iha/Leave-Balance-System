'use client';

import { useState, useEffect } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Search, Edit, History, Shield, RefreshCw } from 'lucide-react';
import { apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { toast, showErrorToast } from '@/lib/sonner-toast';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { SkeletonTable } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  role: {
    id: string;
    name: string;
    color?: string | null;
  };
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

interface Role {
  id: string;
  name: string;
  color?: string | null;
}

const DEFAULT_ROLE_COLOR = '#7c3aed';

function getRoleBadgeStyle(color: string | null | undefined) {
  const safeColor = color || DEFAULT_ROLE_COLOR;
  return {
    borderColor: `${safeColor}55`,
    backgroundColor: `${safeColor}1A`,
    color: safeColor,
  };
}

export function UserAccessTab() {
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

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiRequestRaw<{ success: boolean; data: Role[] }>('/api/v1/roles', {}, user?.id, user?.email),
  });

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
    queryFn: () => apiRequestRaw<UsersResponse>(`/api/v1/users?${usersParamsString}`, undefined, user?.id, user?.email),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!usersQuery.isError) return;
    showErrorToast('Failed to fetch users', 'Error');
  }, [usersQuery.isError]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, roleFilter, statusFilter]);

  const handleEditRole = (targetUser: User) => {
    setSelectedUser(targetUser);
    setNewRole(targetUser.role.id);
    setChangeReason('');
    setIsRoleDialogOpen(true);
  };

  const handleViewHistory = async (targetUser: User) => {
    setHistoryUser(targetUser);
    try {
      const data = await apiRequestRaw<UserHistoryResponse>(`/api/v1/users/${targetUser.id}/history`, undefined, user?.id, user?.email);
      setHistory(data.data.history || []);
      setIsHistoryDialogOpen(true);
    } catch (error) {
      showErrorToast(error, 'Failed to fetch history');
    }
  };

  const roleChangeMutation = useMutation({
    mutationFn: (payload: { userId: string; roleId: string; reason: string }) =>
      apiRequestRaw(`/api/v1/users/${payload.userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: payload.roleId,
          reason: payload.reason,
        }),
      }, user?.id, user?.email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list(usersParamsString) });
    },
  });

  const handleConfirmRoleChange = async () => {
    if (roleChangeMutation.isPending) return;
    if (!selectedUser || !newRole || !changeReason) {
      showErrorToast('Please fill in all fields', 'Validation Error');
      return;
    }

    try {
      await roleChangeMutation.mutateAsync({
        userId: selectedUser.id,
        roleId: newRole,
        reason: changeReason,
      });

      toast({
        title: 'Success',
        description: `${selectedUser.employee?.name}'s role has been updated`,
      });
      setIsConfirmDialogOpen(false);
      setIsRoleDialogOpen(false);
    } catch (error) {
      showErrorToast(error, 'Failed to update user role');
    }
  };

  const paginatedUsers = usersQuery.data?.data ?? [];
  const totalCount = usersQuery.data?.pagination.total ?? 0;
  const totalPages = Math.max(1, usersQuery.data?.pagination.totalPages ?? 1);
  const roles = rolesQuery.data?.data || [];
  const selectedRoleName = roles.find((role) => role.id === newRole)?.name || newRole;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            User Access Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Manage user roles and access permissions</p>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 space-y-0 pb-4">
          <div className="space-y-1.5">
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Showing {paginatedUsers.length} of {totalCount} user{totalCount !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
            <div className="relative w-full sm:w-[320px] group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-muted/50 border-border/50 pl-10 h-11 focus:bg-background transition-all"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-36 bg-muted border-input">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                {roles.map(r => (
                  <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('ALL');
                setStatusFilter('ALL');
                setCurrentPage(1);
                queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
              }}
              variant="outline"
              className="w-full sm:w-auto bg-muted border-input"
              size="sm"
            >
              <RefreshCw className={cn("w-4 h-4", usersQuery.isFetching && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? (
            <SkeletonTable rows={itemsPerPage} columns={6} />
          ) : (
            <>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No results found.
                        </TableCell>
                      </TableRow>
                    )}
                    {paginatedUsers.map((u) => (
                      <TableRow key={u.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">{u.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.employee?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" style={getRoleBadgeStyle(u.role.color)}>
                            {u.role.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.employee?.active ? 'default' : 'secondary'}>
                            {u.employee?.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRole(u)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Role
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHistory(u)}
                            >
                              <History className="w-4 h-4 mr-2" />
                              History
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

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
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.employee?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Current Role</p>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {selectedUser.role.name}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Role</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-2 bg-muted border-input">
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Reason for Change</label>
                <Textarea
                  placeholder="Explain why you're changing this user's role..."
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="mt-2 bg-muted border-input"
                />
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
              disabled={!newRole || !changeReason || newRole === selectedUser?.role.id}
              className="text-white"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {selectedUser?.employee?.name}'s role to <strong>{selectedRoleName}</strong>?
              <br /><br />
              <strong>Reason:</strong> {changeReason}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRoleChange}
              disabled={roleChangeMutation.isPending}
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Role Change History</DialogTitle>
            <DialogDescription>
              Changes for {historyUser?.employee?.name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-96">
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No role changes recorded
                </p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="p-4 border border-border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{entry.oldRole}</Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="outline">{entry.newRole}</Badge>
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
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
