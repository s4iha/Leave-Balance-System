'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { MainContent } from '@/components/layout/main-content';
import { MobileHeader } from '@/components/layout/mobile-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useEffect } from 'react';
import { DateFormatter } from '@/components/date-formatter';
import { SkeletonCard, SkeletonTable } from '@/components/ui/skeleton';

interface DashboardStats {
  totalEmployees?: number;
  totalLeaveTypes?: number;
  teamSize?: number;
  pendingRequests: number;
  approvedThisMonth: number;
  leaveBalances?: Array<{ leaveTypeName: string; balance: number; total: number }>;
  recentRequests: Array<{
    id: string;
    employeeName?: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: string;
    days: number;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => apiRequestRaw<DashboardStats>('/api/v1/dashboard', undefined, user?.id, user?.email),
    enabled: !!user,
  });

  useEffect(() => {
    if (dashboardQuery.isError) {
      console.error('Error fetching dashboard stats:', dashboardQuery.error);
      toast.error('Failed to load dashboard data.');
    }
  }, [dashboardQuery.error, dashboardQuery.isError]);

  const stats = dashboardQuery.data;
  const recentRequests = stats?.recentRequests ?? [];
  const leaveBalances = stats?.leaveBalances ?? [];

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <MobileHeader />
        <Sidebar />
        <MainContent>
          <div className="pt-4 pr-4 pb-4 pl-0 md:pt-8 md:pr-8 md:pb-8 md:pl-0 max-w-7xl mx-auto">
            {/* Header with Role Alert */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4 mb-8">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-foreground">Welcome, {user?.name}!</h1>
                <p className="text-muted-foreground mt-2">Here&apos;s your leave management overview</p>
              </div>

              {/* Role-based welcome message */}
              {user?.role === 'ADMIN' && (
                <div className="mt-6 lg:mt-0 lg:flex-shrink-0 p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Administrator Access</h3>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Full access to all system features.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {user?.role === 'MANAGER' && (
                <div className="mt-6 lg:mt-0 lg:flex-shrink-0 p-4 rounded-xl bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Manager View</h3>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Manage team and approvals.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {dashboardQuery.isLoading ? (
              <div className={`grid gap-4 mb-6 ${user?.role === 'EMPLOYEE' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-4'}`}>
                {Array.from({ length: user?.role === 'EMPLOYEE' ? 3 : 4 }).map((_, i) => (
                  <SkeletonCard key={i} count={2} className="p-0" />
                ))}
              </div>
            ) : (
            <div className={`grid gap-4 mb-6 ${user?.role === 'EMPLOYEE' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-4'}`}>
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <div className="p-6 rounded-xl bg-card border border-border/50 hover:border-border transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        {user?.role === 'ADMIN' ? 'Total Employees' : 'Team Size'}
                      </p>
                      <div className="text-3xl font-bold text-foreground">
                        {dashboardQuery.isLoading ? (
                          <span className="text-muted-foreground text-sm">Loading...</span>
                        ) : user?.role === 'ADMIN' ? (
                          stats?.totalEmployees ?? 0
                        ) : (
                          stats?.teamSize ?? 0
                        )}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-primary/10">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 rounded-xl bg-card border border-border/50 hover:border-border transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {user?.role === 'EMPLOYEE' ? 'My Pending Requests' : 'Pending Requests'}
                    </p>
                    <div className="text-3xl font-bold text-foreground">
                      {dashboardQuery.isLoading ? (
                        <span className="text-muted-foreground text-sm">Loading...</span>
                      ) : (
                        stats?.pendingRequests ?? 0
                      )}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-accent/10">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border/50 hover:border-border transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {user?.role === 'EMPLOYEE' ? 'My Approved' : 'Approved This Month'}
                    </p>
                    <div className="text-3xl font-bold text-foreground">
                      {dashboardQuery.isLoading ? (
                        <span className="text-muted-foreground text-sm">Loading...</span>
                      ) : (
                        stats?.approvedThisMonth ?? 0
                      )}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </div>

              {user?.role !== 'MANAGER' && (
                <div className="p-6 rounded-xl bg-card border border-border/50 hover:border-border transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Leave Types
                      </p>
                      <div className="text-3xl font-bold text-foreground">
                        {dashboardQuery.isLoading ? (
                          <span className="text-muted-foreground text-sm">Loading...</span>
                        ) : (
                          stats?.totalLeaveTypes ?? 0
                        )}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-primary/10">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Main Content Grid */}
            <div className="w-full">
              {/* Recent Requests */}
              <div className="rounded-xl bg-card border border-border/50 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Recent Leave Requests</h2>
                  <p className="text-sm text-muted-foreground mt-1">Your latest leave request activity</p>
                </div>
                <div className="space-y-3">
                  {dashboardQuery.isLoading ? (
                    <SkeletonTable rows={3} columns={2} className="py-8" />
                  ) : recentRequests.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">No recent requests</p>
                    </div>
                  ) : (
                    <>
                      {recentRequests.map((req) => (
                        <div key={req.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">
                              {req.employeeName || 'Your'} {req.leaveType}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              <DateFormatter date={req.startDate} format="MMM d" /> - <DateFormatter date={req.endDate} format="MMM d, yyyy" /> ({req.days} {req.days === 1 ? 'day' : 'days'})
                            </p>
                          </div>
                          <Badge
                            variant={
                              req.status === 'APPROVED'
                                ? 'default'
                                : req.status === 'REJECTED'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {req.status}
                          </Badge>
                        </div>
                      ))}
                      <Link href="/requests" className="block mt-4">
                        <Button variant="outline" className="w-full">
                          View All Requests
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Accrual Information - Only for employees and non-admin managers */}
            {(user?.role === 'EMPLOYEE' || (user?.role === 'MANAGER' && leaveBalances.length === 0)) && leaveBalances.length > 0 && (
              <div className="mt-6 rounded-xl bg-card border border-border/50 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Leave Balance Summary</h2>
                  <p className="text-sm text-muted-foreground mt-1">Your current leave balances by type</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dashboardQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8 col-span-full">
                      <p className="text-muted-foreground">Loading balances...</p>
                    </div>
                  ) : leaveBalances.length === 0 ? (
                    <div className="flex items-center justify-center py-8 col-span-full">
                      <p className="text-muted-foreground">No leave balances</p>
                    </div>
                  ) : (
                    leaveBalances.map((leave) => (
                      <div key={leave.leaveTypeName} className="p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">{leave.leaveTypeName}</h4>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-2xl font-bold text-foreground">{leave.balance}</span>
                          <span className="text-sm text-muted-foreground">/ {leave.total} days</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-primary rounded-full h-2.5 transition-all duration-500"
                            style={{ width: `${(leave.balance / leave.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </MainContent>
      </div>
    </ProtectedRoute>
  );
}
