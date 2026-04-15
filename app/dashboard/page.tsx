'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:ml-64">
          <div className="p-4 md:p-8">
            {/* Header with Role Alert */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name}!</h1>
                <p className="text-muted-foreground mt-2">Here&apos;s your leave management overview</p>
              </div>

              {/* Role-based welcome message */}
              {user?.role === 'ADMIN' && (
                <Card className="border-primary/20 bg-primary/5 flex-shrink-0 h-fit">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">Administrator Access</h3>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          Full access to all system features.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {user?.role === 'MANAGER' && (
                <Card className="border-accent/20 bg-accent/5 flex-shrink-0 h-fit">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-accent flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">Manager View</h3>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          Manage team and approvals.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Stats */}
            <div className={`grid gap-4 mb-6 ${user?.role === 'EMPLOYEE' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-4'}`}>
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Employees
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold text-foreground">
                        {user?.role === 'ADMIN' ? '150' : '12'}
                      </div>
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {user?.role === 'EMPLOYEE' ? 'My Pending Requests' : 'Pending Requests'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold text-foreground">
                      {user?.role === 'ADMIN' ? '8' : user?.role === 'MANAGER' ? '3' : '1'}
                    </div>
                    <Clock className="w-4 h-4 text-accent" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {user?.role === 'EMPLOYEE' ? 'My Approved' : 'Approved This Month'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold text-foreground">
                      {user?.role === 'ADMIN' ? '24' : user?.role === 'MANAGER' ? '7' : '2'}
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Available Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold text-foreground">17</div>
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="w-full">
              {/* Recent Requests */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Recent Leave Requests</CardTitle>
                  <CardDescription>Your latest leave request activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">Summer Vacation</h4>
                        <p className="text-sm text-muted-foreground">May 15 - May 17, 2024 (3 days)</p>
                      </div>
                      <Badge variant={i === 1 ? 'default' : i === 2 ? 'secondary' : 'outline'}>
                        {i === 1 ? 'Submitted' : i === 2 ? 'Approved' : 'Draft'}
                      </Badge>
                    </div>
                  ))}
                  <Link href="/requests">
                    <Button variant="outline" className="w-full">
                      View All Requests
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Accrual Information */}
            <Card className="mt-6 border-border">
              <CardHeader>
                <CardTitle>Leave Balance Summary</CardTitle>
                <CardDescription>Your current leave balances by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'Paid Time Off', balance: 17, total: 20 },
                    { name: 'Sick Leave', balance: 8, total: 10 },
                    { name: 'Casual Leave', balance: 7, total: 8 },
                    { name: 'Maternity Leave', balance: 90, total: 90 },
                  ].map((leave) => (
                    <div key={leave.name} className="p-4 rounded-lg bg-muted/30 border border-border">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">{leave.name}</h4>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-bold text-foreground">{leave.balance}</span>
                        <span className="text-sm text-muted-foreground">/ {leave.total} days</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2"
                          style={{ width: `${(leave.balance / leave.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
