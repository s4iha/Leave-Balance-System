'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast, showErrorToast } from '@/lib/sonner-toast';
import { format } from 'date-fns';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { DateFormatter } from '@/components/date-formatter';
import { SkeletonTable } from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { MainContent } from '@/components/layout/main-content';
import { MobileHeader } from '@/components/layout/mobile-header';
import { useSidebarLayout } from '@/components/layout/sidebar-context';
import { cn } from '@/lib/utils';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditLog {
  id: string;
  actionType: string;
  description: string;
  changes?: string | null;
  user: { id: string; name: string; email: string };
  employee?: { id: string; user: { name: string } };
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AuditLogsPage() {
  const { user } = useAuth();

  const { isCollapsed } = useSidebarLayout();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [filters, setFilters] = useState({
    actionType: '',
    employeeId: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  const skip = (currentPage - 1) * pageSize;
  const paramsString = useMemo(() => {
    const params = new URLSearchParams({
      skip: String(skip),
      take: String(pageSize),
    });
    if (filters.actionType) params.append('actionType', filters.actionType);
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return params.toString();
  }, [filters, skip]);

  const auditLogsQuery = useQuery({
    queryKey: queryKeys.auditLogs.list(paramsString),
    queryFn: () => apiRequestRaw<AuditLogsResponse>(`/api/v1/audit-logs?${paramsString}`, undefined, user?.id, user?.email),
  });

  const logs = auditLogsQuery.data?.logs ?? [];
  const total = auditLogsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  // Handle errors
  React.useEffect(() => {
    if (auditLogsQuery.isError) {
      console.error('Error fetching audit logs:', auditLogsQuery.error);
      showErrorToast(auditLogsQuery.error, 'Failed to load audit logs');
    }
  }, [auditLogsQuery.error, auditLogsQuery.isError, toast]);

  // Export function
  const handleExport = (exportFormat: 'csv' | 'json') => {
    if (!logs.length) {
      showErrorToast('No data to export.', 'Error');
      return;
    }

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (exportFormat === 'csv') {
        // CSV export
        const headers = ['ID', 'Action Type', 'User', 'Description', 'Date', 'Employee'];
        const rows = logs.map((log) => [
          log.id,
          log.actionType,
          log.user.name,
          log.description,
          format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
          log.employee?.user.name || 'N/A',
        ]);

        content = [
          headers.join(','),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        filename = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
      } else {
        // JSON export
        content = JSON.stringify(logs, null, 2);
        filename = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
        mimeType = 'application/json;charset=utf-8;';
      }

      const link = document.createElement('a');
      const blob = new Blob([content], { type: mimeType });
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);

      toast({
        title: 'Success',
        description: `Audit logs exported as ${exportFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error(`Error exporting ${exportFormat}:`, error);
      showErrorToast(error, `Failed to export ${exportFormat.toUpperCase()}`);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const actionTypeColors: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    APPROVE: 'bg-purple-100 text-purple-800',
    REJECT: 'bg-orange-100 text-orange-800',
    LOGIN: 'bg-cyan-100 text-cyan-800',
    LOGOUT: 'bg-gray-100 text-gray-800',
  };

  const formatChanges = (changes: string | null | undefined): string[] => {
    if (!changes) return [];
    try {
      const parsed = JSON.parse(changes) as Record<string, any>;

      // Case 1: Structure has before/after/updates (Standard PATCH logic)
      if (parsed.before || parsed.after || parsed.updates) {
        const before = (parsed.before ?? {}) as Record<string, any>;
        // Fallback: if after is missing but updates exists, use updates
        const after = (parsed.after ?? parsed.updates ?? {}) as Record<string, any>;
        
        const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
        return keys
          .filter((key) => key !== 'password' && key !== 'id')
          .map((key) => {
            const valBefore = before[key];
            const valAfter = after[key];
            
            // If they are the same, don't show (unless it's the only info)
            if (valBefore === valAfter && keys.length > 1) return null;
            
            const from = valBefore === undefined || valBefore === null ? 'null' : JSON.stringify(valBefore);
            const to = valAfter === undefined || valAfter === null ? 'null' : JSON.stringify(valAfter);
            return `${key}: ${from} -> ${to}`;
          })
          .filter(Boolean) as string[];
      }

      // Case 2: Specific status transitions (CANCEL logic)
      if (parsed.fromStatus || parsed.toStatus) {
        return [`status: ${JSON.stringify(parsed.fromStatus ?? 'null')} -> ${JSON.stringify(parsed.toStatus ?? 'null')}`];
      }

      // Case 3: Flat object (CREATE logic or legacy logs)
      return Object.keys(parsed)
        .filter((key) => key !== 'password' && key !== 'id')
        .map((key) => `${key}: (new) -> ${JSON.stringify(parsed[key])}`);
    } catch (e) {
      console.error('Failed to format audit changes:', e);
      return [];
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <MobileHeader />
        <Sidebar />
        <MainContent>
          <div className={cn("pt-4 pr-4 pb-4 pl-4 md:pt-8 md:pr-8 md:pb-8", isCollapsed ? "md:px-8" : "md:px-8", "max-w-8xl mx-auto")}>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h1>
              <p className="text-muted-foreground mt-2">Track system activity and changes</p>
            </div>

            <Card className="my-6 border-border">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Refine your audit log search</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Action Type</label>
                    <Select value={filters.actionType || 'ALL'} onValueChange={(value) => handleFilterChange('actionType', value === 'ALL' ? '' : value)}>
                      <SelectTrigger className="w-full bg-muted border-input">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Actions</SelectItem>
                        <SelectItem value="CREATE">Create</SelectItem>
                        <SelectItem value="UPDATE">Update</SelectItem>
                        <SelectItem value="DELETE">Delete</SelectItem>
                        <SelectItem value="APPROVE">Approve</SelectItem>
                        <SelectItem value="REJECT">Reject</SelectItem>
                        <SelectItem value="LOGIN">Login</SelectItem>
                        <SelectItem value="LOGOUT">Logout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">User ID</label>
                    <Input
                      placeholder="Filter by User ID"
                      value={filters.userId}
                      onChange={(e) => handleFilterChange('userId', e.target.value)}
                      className="bg-muted border-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Employee ID</label>
                    <Input
                      placeholder="Filter by Employee ID"
                      value={filters.employeeId}
                      onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                      className="bg-muted border-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Date Range</label>
                    <DatePickerWithRange
                      date={{
                        from: filters.startDate ? new Date(filters.startDate) : undefined,
                        to: filters.endDate ? new Date(filters.endDate) : undefined,
                      }}
                      setDate={(date) => {
                        const toLocalDateString = (d: Date) => {
                          const offset = d.getTimezoneOffset();
                          const adjustedDate = new Date(d.getTime() - (offset * 60 * 1000));
                          return adjustedDate.toISOString().split('T')[0];
                        };
                        setFilters((prev) => ({
                          ...prev,
                          startDate: date?.from ? toLocalDateString(date.from) : '',
                          endDate: date?.to ? toLocalDateString(date.to) : (date?.from ? toLocalDateString(date.from) : ''),
                        }));
                        setCurrentPage(1);
                      }}
                    />
                  </div>

                  <div className="flex gap-2 items-end">
                    <Button variant="outline" onClick={() => setFilters({ actionType: '', employeeId: '', userId: '', startDate: '', endDate: '' })}>
                      Reset
                    </Button>
                  </div>

                  <div className="flex gap-2 items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('csv')}
                      disabled={auditLogsQuery.isLoading || !logs.length}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('json')}
                      disabled={auditLogsQuery.isLoading || !logs.length}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      JSON
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Total records: {total}</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogsQuery.isLoading ? (
                  <div className="py-4">
                    <SkeletonTable rows={pageSize} columns={5} />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">No audit logs found.</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                            <TableRow>
                              <TableHead>Action</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Changes</TableHead>
                              <TableHead>Employee</TableHead>
                              <TableHead>Date & Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                <Badge className={actionTypeColors[log.actionType] || 'bg-gray-100 text-gray-800'}>
                                  {log.actionType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{log.user.name}</TableCell>
                              <TableCell className="text-sm max-w-[250px] truncate" title={log.description}>
                                {log.description}
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatChanges(log.changes).length > 0 ? (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" size="sm">View Changes</Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-[360px] max-h-72 overflow-auto">
                                      <div className="space-y-2">
                                        {formatChanges(log.changes).map((entry) => (
                                          <p key={entry} className="text-xs text-muted-foreground break-words">
                                            {entry}
                                          </p>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">{log.employee?.user.name || '-'}</TableCell>
                              <TableCell className="text-sm whitespace-nowrap">
                                <DateFormatter date={log.createdAt} format="MMM d, yyyy HH:mm" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>

                    {totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-center">
                        <Pagination>
                          <PaginationContent>
                            {currentPage > 1 && (
                              <PaginationItem>
                                <PaginationPrevious
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(Math.max(1, currentPage - 1));
                                  }}
                                />
                              </PaginationItem>
                            )}

                            {Array.from({ length: totalPages }, (_, i) => {
                              const page = i + 1;
                              const isVisible = Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages;
                              return isVisible ? (
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
                              ) : page === 2 && currentPage > 3 ? (
                                <PaginationItem key="ellipsis-start">
                                  <span className="px-2">...</span>
                                </PaginationItem>
                              ) : page === totalPages - 1 && currentPage < totalPages - 2 ? (
                                <PaginationItem key="ellipsis-end">
                                  <span className="px-2">...</span>
                                </PaginationItem>
                              ) : null;
                            })}

                            {currentPage < totalPages && (
                              <PaginationItem>
                                <PaginationNext
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                                  }}
                                />
                              </PaginationItem>
                            )}
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </MainContent>
      </div>
    </ProtectedRoute>

  );
}
