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
import { showErrorToast } from '@/lib/sonner-toast';
import { apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { DateFormatter } from '@/components/date-formatter';
import { SkeletonCard, SkeletonTable } from '@/components/ui/skeleton';
import { useSidebarLayout } from '@/components/layout/sidebar-context';
import { cn } from '@/lib/utils';

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
  const { isCollapsed } = useSidebarLayout();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => apiRequestRaw<DashboardStats>('/api/v1/dashboard', undefined, user?.id, user?.email),
    enabled: !!user && isMounted,
  });

  useEffect(() => {
    if (dashboardQuery.isError) {
      console.error('Error fetching dashboard stats:', dashboardQuery.error);
      showErrorToast(dashboardQuery.error, 'Failed to load dashboard data');
    }
  }, [dashboardQuery.error, dashboardQuery.isError]);

  const stats = dashboardQuery.data;
  const recentRequests = stats?.recentRequests ?? [];
  const leaveBalances = stats?.leaveBalances ?? [];

  // Prevent hydration mismatch by only rendering once mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <MobileHeader />
        <Sidebar />
        <MainContent>
          <div className={cn("pt-4 pr-4 pb-4 pl-4 md:pt-8 md:pr-8 md:pb-8 md:px-8 max-w-8xl mx-auto")}>
            {/* Header with Role Alert */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4 mb-8">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-foreground">Welcome, {user?.name}!</h1>
                <p className="text-muted-foreground mt-2">Here&apos;s your leave management overview</p>
              </div>

              {/* Role-based welcome message */}
              {user?.role === 'System Admin' && (
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

              {user?.role === 'Manager' && (
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
              <div className={`grid gap-4 mb-6 ${user?.role === 'Employee' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-4'}`}>
                {Array.from({ length: user?.role === 'Employee' ? 3 : 4 }).map((_, i) => (
                  <SkeletonCard key={i} className="p-0" />
                ))}
              </div>
            ) : (
              <div className={`grid gap-4 mb-6 ${user?.role === 'Employee' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-4'}`}>
                {(user?.role === 'System Admin' || user?.role === 'Manager') && (
                  <div className="p-6 rounded-xl bg-card border border-border/50 hover:border-border transition-colors shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-5">
                          {user?.role === 'System Admin' ? 'Total Employees' : 'Team Size'}
                        </p>
                        <div className="text-3xl font-bold text-foreground">
                          {user?.role === 'System Admin' ? (stats?.totalEmployees ?? 0) : (stats?.teamSize ?? 0)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-6 rounded-xl bg-card border border-border/50 hover:border-border transition-colors shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-5">
                        {user?.role === 'Employee' ? 'My Pending Requests' : 'Pending Requests'}
                      </p>
                      <div className="text-4xl font-bold text-foreground">
                        {stats?.pendingRequests ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-accent/10">
                      <Clock className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border/50 hover:border-border transition-colors shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-5">
                        {user?.role === 'Employee' ? 'My Approved' : 'Approved This Month'}
                      </p>
                      <div className="text-3xl font-bold text-foreground">
                        {stats?.approvedThisMonth ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-green-500/10">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </div>

                {user?.role !== 'Manager' && (
                  <div className="p-6 rounded-xl bg-card border border-border/50 hover:border-border transition-colors shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-5">
                          Leave Types
                        </p>
                        <div className="text-3xl font-bold text-foreground">
                          {stats?.totalLeaveTypes ?? 0}
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column: Balances & Activity */}
              <div className="xl:col-span-2 space-y-8">
                {/* Leave Balances Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">My Leave Balances</h2>
                      <p className="text-sm text-muted-foreground mt-1">Remaining days for the current year</p>
                    </div>
                    <Link href="/requests">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5">
                        View Details
                      </Button>
                    </Link>
                  </div>

                  {dashboardQuery.isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SkeletonCard className="h-32" />
                      <SkeletonCard className="h-32" />
                    </div>
                  ) : leaveBalances.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-muted/30 border border-dashed border-border">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground font-medium">No leave balances found</p>
                      <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs">
                        Contact HR if you believe this is an error with your accrual scheme.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {leaveBalances.map((balance, index) => (
                        <div key={index} className="group p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{balance.leaveTypeName}</span>
                            <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              <Calendar className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-bold text-foreground">{balance.balance}</span>
                            <span className="text-sm text-muted-foreground">/ {balance.total} days</span>
                          </div>
                          {/* Minimal Progress Bar */}
                          <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, (balance.balance / balance.total) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Recent Activity */}
                <section>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Recent Activity</h2>
                    <p className="text-sm text-muted-foreground mt-1">Status of your latest requests</p>
                  </div>
                  <div className="space-y-3">
                    {dashboardQuery.isLoading ? (
                      <SkeletonTable rows={3} columns={2} className="py-8" />
                    ) : recentRequests.length === 0 ? (
                      <div className="flex items-center justify-center py-12 rounded-2xl bg-muted/30 border border-dashed border-border">
                        <p className="text-muted-foreground">No recent activity</p>
                      </div>
                    ) : (
                      <>
                        {recentRequests.map((req) => (
                          <div key={req.id} className="flex items-center justify-between p-5 rounded-2xl bg-card border border-border/50 hover:bg-muted/30 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "p-3 rounded-xl transition-colors",
                                req.status === 'APPROVED' ? "bg-green-500/10 text-green-500" :
                                req.status === 'REJECTED' ? "bg-destructive/10 text-destructive" :
                                "bg-primary/10 text-primary"
                              )}>
                                <Clock className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                                  {req.employeeName ? `${req.employeeName}: ` : ''}{req.leaveType}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <DateFormatter date={req.startDate} format="MMM d" />
                                  <span>-</span>
                                  <DateFormatter date={req.endDate} format="MMM d" />
                                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted font-medium">
                                    {req.days} {req.days === 1 ? 'day' : 'days'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Badge
                              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
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
                        <Link href="/requests" className="block mt-6">
                          <Button variant="outline" className="w-full h-12 rounded-xl font-semibold hover:bg-primary hover:text-white transition-all">
                            View All Requests
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column: Quick Actions & Help (Placeholder for future expansion) */}
              <div className="space-y-8">
                <section className="p-6 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
                  <h3 className="text-lg font-bold mb-2">Need Time Off?</h3>
                  <p className="text-primary-foreground/90 text-sm mb-6 leading-relaxed">
                    Submit your leave request today and get it approved by your manager in no time.
                  </p>
                  <Link href="/requests">
                    <Button variant="secondary" className="w-full font-bold h-11">
                      Create New Request
                    </Button>
                  </Link>
                </section>
                
                <section className="p-6 rounded-2xl bg-card border border-border/50">
                  <h3 className="font-bold text-foreground mb-4">Useful Links</h3>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary h-10 px-3">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Leave Policy
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary h-10 px-3">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Holiday Calendar
                    </Button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </MainContent>
      </div>
    </ProtectedRoute>
  );
}
