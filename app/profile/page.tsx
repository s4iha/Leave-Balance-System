'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { MainContent } from '@/components/layout/main-content';
import { MobileHeader } from '@/components/layout/mobile-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast, showErrorToast } from '@/lib/sonner-toast';
import { apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useSidebarLayout } from '@/components/layout/sidebar-context';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordValidator } from '@/components/auth/password-validator';
import { cn } from '@/lib/utils';
import {
  User,
  Briefcase,
  Building2,
  Calendar,
  Mail,
  Shield,
  Timer,
  Fingerprint,
  History as HistoryIcon,
  Settings as SettingsIcon,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  employees: Array<{
    id: string;
    designation: string;
    employeeNumber: string | null;
    hireDate: string;
    accrualScheme: string;
    timeZone: string | null;
    workHoursPerDay: number | null;
    department: {
      name: string;
      code: string;
    };
    manager: {
      name: string;
      email: string;
    } | null;
    leaveBalances: Array<{
      id: string;
      leaveType: {
        name: string;
      };
      closingBalance: number;
    }>;
    leaveRequests: Array<{
      id: string;
      startDate: string;
      endDate: string;
      durationDays: number;
      reason: string;
      status: string;
      leaveType: {
        name: string;
      };
      createdAt: string;
    }>;
  }>;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { isCollapsed } = useSidebarLayout();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(user?.requiresPasswordChange ? 'security' : 'employment');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);

  const isPasswordValid =
    passwordForm.newPassword.length >= 8 &&
    /[a-z]/.test(passwordForm.newPassword) &&
    /[A-Z]/.test(passwordForm.newPassword) &&
    /[0-9]/.test(passwordForm.newPassword) &&
    /[^A-Za-z0-9]/.test(passwordForm.newPassword) &&
    passwordForm.newPassword === passwordForm.confirmPassword;

  const profileQuery = useQuery({
    queryKey: queryKeys.users.detail(user?.id || 'me'),
    queryFn: () => apiRequestRaw<{ data: ProfileData }>('/api/v1/profile', undefined, user?.id, user?.email),
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { timeZone?: string; workHoursPerDay?: number }) =>
      apiRequestRaw('/api/v1/profile', { method: 'PATCH', body: JSON.stringify(data) }, user?.id, user?.email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(user?.id || 'me') });
      toast({ title: 'Profile updated successfully' });
      setIsEditing(false);
    },
    onError: (error: any) => {
      showErrorToast(error, 'Failed to update profile');
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequestRaw('/api/v1/auth/change-password', { method: 'POST', body: JSON.stringify(data) }, user?.id, user?.email),
    onSuccess: () => {
      toast({ title: 'Password changed successfully' });
      if (updateUser) {
        updateUser({ requiresPasswordChange: false });
      }
      setActiveTab('employment');
    },
    onError: (error: any) => {
      showErrorToast(error, 'Failed to change password');
    }
  });

  const handleChangePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isPasswordValid) return;

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const profile = profileQuery.data?.data;
  const employee = profile?.employees[0];

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      timeZone: formData.get('timeZone') as string,
      workHoursPerDay: Number(formData.get('workHoursPerDay')),
    };
    updateProfileMutation.mutate(data);
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <MobileHeader />
        <Sidebar />
        <MainContent>
          <div className={cn("pt-4 pr-4 pb-4 pl-4 md:pt-8 md:pr-8 md:pb-8", isCollapsed ? "md:px-8" : "md:px-8", "max-w-8xl mx-auto")}>
            {/* Header / Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8 md:p-12 mb-8">
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border-4 border-background shadow-xl">
                  <User className="w-12 h-12 md:w-16 md:h-16" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Badge variant="outline" className="mb-2 bg-primary/5 text-primary border-primary/20 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                      {profile?.role || '...'}
                    </Badge>
                    <div className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                      {profile?.name || <Skeleton className="h-10 w-48 mx-auto md:mx-0" />}
                    </div>
                    <div className="text-lg text-muted-foreground mt-2 flex items-center justify-center md:justify-start gap-2">
                      <Mail className="w-4 h-4" />
                      {profile?.email || <Skeleton className="h-4 w-32" />}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <Badge variant="secondary" className="px-4 py-1.5 rounded-full flex items-center gap-2 bg-card border border-border shadow-sm">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      {employee?.department.name || '---'}
                    </Badge>
                    <Badge variant="secondary" className="px-4 py-1.5 rounded-full flex items-center gap-2 bg-card border border-border shadow-sm">
                      <Briefcase className="w-3.5 h-3.5 text-primary" />
                      {employee?.designation || '---'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="employment" className="rounded-lg px-6" disabled={user?.requiresPasswordChange}>Employment</TabsTrigger>
                <TabsTrigger value="security" className="rounded-lg px-6">Security</TabsTrigger>
              </TabsList>

              {user?.requiresPasswordChange && (
                <div className="bg-destructive/10 w-fit border border-destructive/20 p-4 rounded-xl flex items-center gap-3 text-destructive animate-pulse">
                  <Shield className="w-5 h-5" />
                  <p className="text-sm font-semibold">Security Action Required: Please update your temporary password to continue.</p>
                </div>
              )}

              <TabsContent value="employment" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Employment Details */}
                  <Card className="md:col-span-2 border-border/50 shadow-sm overflow-hidden group">
                    <CardHeader className="pt-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <CardTitle>Employment Profile</CardTitle>
                      </div>
                      <CardDescription>Official HR record information</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <DetailItem
                        icon={Fingerprint}
                        label="Employee Number"
                        value={employee?.employeeNumber || 'Not Assigned'}
                      />
                      <DetailItem
                        icon={Calendar}
                        label="Date of Hire"
                        value={employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString('en-US', { dateStyle: 'long' }) : '---'}
                      />
                      <DetailItem
                        icon={Timer}
                        label="Accrual Scheme"
                        value={employee?.accrualScheme || '---'}
                        subtext="Periodic balance increments"
                      />
                      <DetailItem
                        icon={User}
                        label="Supervisor"
                        value={employee?.manager?.name || 'Self-Managed'}
                        subtext={employee?.manager?.email}
                      />
                      <DetailItem
                        icon={Timer}
                        label="Work Hours / Day"
                        value={`${employee?.workHoursPerDay || 8} Hours`}
                      />
                      <DetailItem
                        icon={Clock}
                        label="Local Time Zone"
                        value={employee?.timeZone || 'UTC'}
                      />
                    </CardContent>
                  </Card>

                  {/* Leave Summary */}
                  <Card className="border-border/50 shadow-sm bg-card overflow-hidden">
                    <CardHeader className="pt-4">
                      <CardTitle className="flex items-center gap-2">
                        <Timer className="w-5 h-5 text-primary" />
                        Balances
                      </CardTitle>
                      <CardDescription>Current year available days</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 divide-y divide-border/50">
                      {profileQuery.isLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                        </div>
                      ) : employee?.leaveBalances.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No leave records found for current year.</p>
                      ) : (
                        employee?.leaveBalances.map((balance) => (
                          <div key={balance.id} className="py-4 flex justify-between items-center group">
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {balance.leaveType.name}
                            </span>
                            <div className="text-right">
                              <span className="text-xl font-bold text-foreground">
                                {balance.closingBalance}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">days</span>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

              </TabsContent>

              <TabsContent value="security">
                <Card className="max-w-2xl border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>Update your account password and security preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-muted-foreground">Form Controls</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="text-primary hover:text-primary/80 hover:bg-primary/5 gap-2 h-8"
                        >
                          {showPasswords ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              <span className="text-xs">Hide All Passwords</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              <span className="text-xs">Show All Passwords</span>
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <PasswordInput
                            id="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            showPassword={showPasswords}
                            hideToggle
                            required
                            className="bg-muted/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <PasswordInput
                            id="newPassword"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            showPassword={showPasswords}
                            hideToggle
                            required
                            className="bg-muted/30"
                          />
                          <PasswordValidator password={passwordForm.newPassword} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <PasswordInput
                            id="confirmPassword"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            showPassword={showPasswords}
                            hideToggle
                            required
                            className="bg-muted/30"
                          />
                          {passwordForm.confirmPassword && (
                            <div className={cn(
                              "flex items-center gap-2 text-xs mt-1.5",
                              passwordForm.newPassword === passwordForm.confirmPassword ? "text-green-600" : "text-destructive"
                            )}>
                              {passwordForm.newPassword === passwordForm.confirmPassword ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Passwords match</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Passwords do not match</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending || !isPasswordValid}
                        className="w-full sm:w-auto px-8"
                      >
                        {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </MainContent>
      </div>
    </ProtectedRoute>
  );
}

function DetailItem({ icon: Icon, label, value, subtext }: { icon: any, label: string, value: string, subtext?: string | null }) {
  return (
    <div className="flex gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-base font-semibold text-foreground tracking-tight">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { label: string, icon: any, class: string }> = {
    APPROVED: { label: 'Approved', icon: CheckCircle2, class: 'bg-green-500/10 text-green-600 border-green-200' },
    SUBMITTED: { label: 'Pending', icon: Clock, class: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
    DRAFT: { label: 'Draft', icon: FileText, class: 'bg-blue-500/10 text-blue-600 border-blue-200' },
    REJECTED: { label: 'Rejected', icon: XCircle, class: 'bg-red-500/10 text-red-600 border-red-200' },
    CANCELLED: { label: 'Cancelled', icon: XCircle, class: 'bg-gray-500/10 text-gray-600 border-gray-200' },
  };

  const config = styles[status] || styles.SUBMITTED;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("flex items-center gap-1 w-fit", config.class)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
