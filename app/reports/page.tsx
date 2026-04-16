'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';

// Mock accrual data
const accrualData = {
  MONTHLY: [
    { month: 'Jan', accrued: 1.67, used: 0.5, balance: 17.5 },
    { month: 'Feb', accrued: 1.67, used: 1.2, balance: 18.0 },
    { month: 'Mar', accrued: 1.67, used: 2.1, balance: 17.6 },
    { month: 'Apr', accrued: 1.67, used: 0.8, balance: 18.5 },
    { month: 'May', accrued: 1.67, used: 3.0, balance: 17.2 },
    { month: 'Jun', accrued: 1.67, used: 1.5, balance: 17.4 },
  ],
  SEMESTER: [
    { period: 'H1', accrued: 10, used: 4.5, balance: 15.5 },
    { period: 'H2', accrued: 10, used: 0, balance: 25.5 },
  ],
  ANNUAL: [
    { year: '2024', accrued: 20, used: 8, balance: 12, carried: 0 },
    { year: '2023', accrued: 20, used: 15, balance: 0, carried: 5 },
  ],
};

// Mock department balance data
const departmentBalances = [
  { department: 'Engineering', totalBalance: 145.5, avgBalance: 14.5 },
  { department: 'Sales', totalBalance: 98.2, avgBalance: 12.3 },
  { department: 'HR', totalBalance: 42.1, avgBalance: 14.0 },
  { department: 'Finance', totalBalance: 55.3, avgBalance: 13.8 },
  { department: 'Marketing', totalBalance: 38.5, avgBalance: 11.2 },
];

// Leave type distribution
const leaveTypeDistribution = [
  { name: 'PTO', value: 120, fill: '#3b82f6' },
  { name: 'Sick Leave', value: 45, fill: '#10b981' },
  { name: 'Casual Leave', value: 35, fill: '#f59e0b' },
  { name: 'Maternity', value: 25, fill: '#8b5cf6' },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedScheme, setSelectedScheme] = useState<'MONTHLY' | 'SEMESTER' | 'ANNUAL'>('MONTHLY');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');

  const data = accrualData[selectedScheme];
  const xAxisKey = selectedScheme === 'MONTHLY' ? 'month' : selectedScheme === 'SEMESTER' ? 'period' : 'year';

  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-muted-foreground mt-2">Leave balance tracking and organizational analytics</p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <label className="text-sm font-medium text-foreground block mb-2">Accrual Scheme</label>
                  <Select value={selectedScheme} onValueChange={(val: any) => setSelectedScheme(val)}>
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
                      {departmentBalances.map((dept) => (
                        <SelectItem key={dept.department} value={dept.department}>
                          {dept.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">379.6</div>
                  <p className="text-xs text-muted-foreground mt-1">Days across all types</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">13.6</div>
                  <p className="text-xs text-muted-foreground mt-1">Per employee per type</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Used This Year</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">67.3</div>
                  <p className="text-xs text-muted-foreground mt-1">Days consumed</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">3</div>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Accrual Trends */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Accrual & Usage Trends</CardTitle>
                  <CardDescription>
                    {selectedScheme === 'MONTHLY' ? 'Monthly' : selectedScheme === 'SEMESTER' ? 'Semester' : 'Annual'} accrual patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey={xAxisKey} stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="accrued" fill="var(--color-primary)" name="Accrued" />
                      <Bar dataKey="used" fill="var(--color-accent)" name="Used" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Leave Type Distribution */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Leave Type Distribution</CardTitle>
                  <CardDescription>Days used by leave type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={leaveTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {leaveTypeDistribution.map((entry, index) => (
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
            </div>

            {/* Department Balances Table */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Department Leave Balances</CardTitle>
                <CardDescription>Total and average leave balances by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead>Total Balance</TableHead>
                        <TableHead>Avg Balance/Employee</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departmentBalances.map((dept) => (
                        <TableRow key={dept.department}>
                          <TableCell className="font-medium text-foreground">{dept.department}</TableCell>
                          <TableCell className="font-mono text-foreground">{dept.totalBalance} days</TableCell>
                          <TableCell className="font-mono text-foreground">{dept.avgBalance} days</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Healthy
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Accrual Information */}
            <Card className="mt-6 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Accrual Scheme Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Monthly Accrual</h4>
                    <p className="text-sm text-muted-foreground">
                      Employees accrue leave monthly, typically 1.67 days per month (20 days/year).
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Semester Accrual</h4>
                    <p className="text-sm text-muted-foreground">
                      Leave accrued twice per year (10 days per semester). Better for policy management.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Annual Accrual</h4>
                    <p className="text-sm text-muted-foreground">
                      All leave accrued at the start of the year. Good for senior management roles.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
