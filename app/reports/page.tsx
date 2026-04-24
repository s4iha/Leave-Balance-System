'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { MainContent } from '@/components/layout/main-content';
import { MobileHeader } from '@/components/layout/mobile-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import { apiRequestRaw, ReportResponse } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/sonner-toast';

type AccrualScheme = 'MONTHLY' | 'SEMESTER' | 'ANNUAL';

interface BalanceReportItem {
  id: string;
  scheme: AccrualScheme;
  openingBalance: number;
  accrued: number;
  used: number;
  adjusted: number;
  closingBalance: number;
  employee: {
    id: string;
    user: {
      name: string | null;
    };
  };
  leaveType: {
    id: string;
    name: string;
  };
}

type AccrualReportData = Record<
  string,
  {
    count: number;
    totalBalance: number;
    employees: { id: string; name: string | null; email: string | null }[];
  }
>;

type LeaveTypeReportData = Record<string, { count: number; totalDays: number }>;

interface Department {
  id: string;
  name: string;
  code: string;
}

interface DepartmentListResponse {
  success: boolean;
  data: Department[];
}

const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedScheme, setSelectedScheme] = useState<AccrualScheme>('MONTHLY');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'accrual' | 'leave-type'>('accrual');

  const canAccess = Boolean(user && (user.role === 'ADMIN' || user.role === 'MANAGER'));

  const filters = useMemo(() => {
    const params = new URLSearchParams({ year: selectedYear });
    if (selectedDepartment !== 'ALL') {
      params.set('department', selectedDepartment);
    }
    return params;
  }, [selectedDepartment, selectedYear]);

  const balanceParams = useMemo(() => {
    const params = new URLSearchParams(filters);
    params.set('type', 'balance');
    return params.toString();
  }, [filters]);

  const accrualParams = useMemo(() => {
    const params = new URLSearchParams(filters);
    params.set('type', 'accrual');
    return params.toString();
  }, [filters]);

  const leaveTypeParams = useMemo(() => {
    const params = new URLSearchParams({
      type: 'leave-type',
      year: selectedYear,
    });
    return params.toString();
  }, [selectedYear]);

  const departmentsQuery = useQuery({
    queryKey: queryKeys.departments.list('skip=0&take=100'),
    queryFn: () => apiRequestRaw<DepartmentListResponse>('/api/v1/departments?skip=0&take=100'),
    enabled: canAccess,
    staleTime: 10 * 60 * 1000,
  });

  const balanceReportQuery = useQuery({
    queryKey: queryKeys.reports.list(balanceParams),
    queryFn: () => apiRequestRaw<ReportResponse<BalanceReportItem[]>>(`/api/v1/reports?${balanceParams}`),
    enabled: canAccess,
    staleTime: 60 * 1000,
  });

  const accrualReportQuery = useQuery({
    queryKey: queryKeys.reports.summary(accrualParams),
    queryFn: () => apiRequestRaw<ReportResponse<AccrualReportData>>(`/api/v1/reports?${accrualParams}`),
    enabled: canAccess && activeAnalyticsTab === 'accrual',
    staleTime: 2 * 60 * 1000,
  });

  const leaveTypeReportQuery = useQuery({
    queryKey: queryKeys.reports.summary(leaveTypeParams),
    queryFn: () => apiRequestRaw<ReportResponse<LeaveTypeReportData>>(`/api/v1/reports?${leaveTypeParams}`),
    enabled: canAccess && activeAnalyticsTab === 'leave-type',
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (!balanceReportQuery.isError) return;
    console.error('Error fetching balance report:', balanceReportQuery.error);
    toast({
      title: 'Error',
      description: 'Failed to load balance report data.',
      variant: 'destructive',
    });
  }, [balanceReportQuery.error, balanceReportQuery.isError, toast]);

  useEffect(() => {
    if (!accrualReportQuery.isError) return;
    console.error('Error fetching accrual report:', accrualReportQuery.error);
    toast({
      title: 'Error',
      description: 'Failed to load accrual report data.',
      variant: 'destructive',
    });
  }, [accrualReportQuery.error, accrualReportQuery.isError, toast]);

  useEffect(() => {
    if (!leaveTypeReportQuery.isError) return;
    console.error('Error fetching leave type report:', leaveTypeReportQuery.error);
    toast({
      title: 'Error',
      description: 'Failed to load leave type report data.',
      variant: 'destructive',
    });
  }, [leaveTypeReportQuery.error, leaveTypeReportQuery.isError, toast]);

  const allBalances = balanceReportQuery.data?.data || [];
  const filteredBalances = allBalances.filter((item) => item.scheme === selectedScheme);

  const accrualSummary = accrualReportQuery.data?.data || {};
  const accrualChartData = Object.entries(accrualSummary).map(([scheme, values]) => ({
    scheme,
    employees: values.count,
    totalBalance: Number(values.totalBalance.toFixed(1)),
  }));

  const leaveTypeDistribution = leaveTypeReportQuery.data?.data || {};
  const leaveTypeChartData = Object.entries(leaveTypeDistribution).map(([name, values], index) => ({
    name,
    value: Number(values.totalDays.toFixed(1)),
    fill: chartColors[index % chartColors.length],
  }));

  const totalBalance = filteredBalances.reduce((sum, row) => sum + row.closingBalance, 0);
  const averageBalance = filteredBalances.length > 0 ? totalBalance / filteredBalances.length : 0;
  const usedThisYear = filteredBalances.reduce((sum, row) => sum + row.used, 0);
  const approvedRequests = leaveTypeReportQuery.data
    ? Object.values(leaveTypeDistribution).reduce((sum, row) => sum + row.count, 0)
    : null;

  const departments = departmentsQuery.data?.data || [];

  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
      <div className="flex h-screen bg-background">
        <MobileHeader />
        <Sidebar />
        <MainContent>
          <div className="pt-4 pr-4 pb-4 pl-0 md:pt-8 md:pr-8 md:pb-8 md:pl-0 max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-muted-foreground mt-2">Leave balance tracking and organizational analytics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <label className="text-sm font-medium text-foreground block mb-2">Accrual Scheme</label>
                  <Select
                    value={selectedScheme}
                    onValueChange={(value: AccrualScheme) => setSelectedScheme(value)}
                  >
                    <SelectTrigger className="bg-muted border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="SEMESTER">Semester</SelectItem>
                      <SelectItem value="ANNUAL">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="pt-6">
                  <label className="text-sm font-medium text-foreground block mb-2">Department</label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="bg-muted border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Departments</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.name}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="pt-6">
                  <label className="text-sm font-medium text-foreground block mb-2">Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="bg-muted border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, index) => {
                        const year = (new Date().getFullYear() - index).toString();
                        return (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{totalBalance.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Days for {selectedScheme.toLowerCase()} scheme</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{averageBalance.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Per employee/leave type record</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Used This Year</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{usedThisYear.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Days consumed in filtered results</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Approved Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{approvedRequests ?? '-'}</div>
                  <p className="text-xs text-muted-foreground mt-1">Count from leave-type report</p>
                </CardContent>
              </Card>
            </div>

            <div className="mb-4 border-b border-border">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveAnalyticsTab('accrual')}
                  className={`px-4 py-2 border-b-2 transition-colors font-medium ${
                    activeAnalyticsTab === 'accrual'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Accrual Analytics
                </button>
                <button
                  onClick={() => setActiveAnalyticsTab('leave-type')}
                  className={`px-4 py-2 border-b-2 transition-colors font-medium ${
                    activeAnalyticsTab === 'leave-type'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Leave-Type Analytics
                </button>
              </div>
            </div>

            <div className="mb-6">
              {activeAnalyticsTab === 'accrual' && (
                <Card className="border-border">
                <CardHeader>
                  <CardTitle>Accrual Scheme Overview</CardTitle>
                  <CardDescription>Employee count and total balance by scheme ({selectedYear})</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={accrualChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="scheme" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="employees" fill="var(--color-primary)" name="Employees" />
                      <Bar dataKey="totalBalance" fill="var(--color-accent)" name="Total Balance" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              )}

              {activeAnalyticsTab === 'leave-type' && (
                <Card className="border-border">
                <CardHeader>
                  <CardTitle>Leave Type Distribution</CardTitle>
                  <CardDescription>Approved leave days by leave type ({selectedYear})</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={leaveTypeChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {leaveTypeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              )}
            </div>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Employee Leave Balances</CardTitle>
                <CardDescription>
                  Balance records for {selectedScheme.toLowerCase()} scheme in {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Opening</TableHead>
                        <TableHead>Accrued</TableHead>
                        <TableHead>Used</TableHead>
                        <TableHead>Adjusted</TableHead>
                        <TableHead>Closing</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balanceReportQuery.isLoading && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            Loading report data...
                          </TableCell>
                        </TableRow>
                      )}
                      {!balanceReportQuery.isLoading && filteredBalances.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No balance records found for current filters.
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredBalances.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium text-foreground">{row.employee.user.name || 'Unknown'}</TableCell>
                          <TableCell className="text-muted-foreground">{row.leaveType.name}</TableCell>
                          <TableCell className="font-mono text-foreground">{row.openingBalance.toFixed(1)}</TableCell>
                          <TableCell className="font-mono text-foreground">{row.accrued.toFixed(1)}</TableCell>
                          <TableCell className="font-mono text-foreground">{row.used.toFixed(1)}</TableCell>
                          <TableCell className="font-mono text-foreground">{row.adjusted.toFixed(1)}</TableCell>
                          <TableCell className="font-mono text-foreground">{row.closingBalance.toFixed(1)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {row.closingBalance >= 0 ? 'Healthy' : 'Negative'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Report Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Balance Report</h4>
                    <p className="text-sm text-muted-foreground">
                      Sourced from <code>/api/v1/reports?type=balance</code> using selected year and department filters.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Accrual Report</h4>
                    <p className="text-sm text-muted-foreground">
                      Sourced from <code>/api/v1/reports?type=accrual</code> and visualized by accrual scheme.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Leave-Type Report</h4>
                    <p className="text-sm text-muted-foreground">
                      Sourced from <code>/api/v1/reports?type=leave-type</code> to show approved leave-day distribution.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </MainContent>
      </div>
    </ProtectedRoute>
  );
}
