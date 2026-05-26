'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiRequestRaw } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Briefcase,
  ClipboardCheck,
  Moon,
  Sun,
  Shield,
  Building2,
  User,
  PanelLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useSidebarLayout } from '@/components/layout/sidebar-context';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigationSections = [
  {
    category: 'Main',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permissions: [],
      },
      {
        label: 'Profile',
        href: '/profile',
        icon: User,
        permissions: [],
      },
    ],
  },
  {
    category: 'HR Management',
    items: [
      {
        label: 'Employees',
        href: '/employees',
        icon: Users,
        permissions: [{ action: 'MANAGE', resource: 'USER' }, { action: 'APPROVE', resource: 'LEAVE_REQUEST' }],
      },
      {
        label: 'Departments',
        href: '/departments',
        icon: Building2,
        permissions: [{ action: 'MANAGE', resource: 'USER' }],
      },
      {
        label: 'Leave Types',
        href: '/leave-types',
        icon: Briefcase,
        permissions: [{ action: 'MANAGE', resource: 'USER' }],
      },
    ],
  },
  {
    category: 'Leave Management',
    items: [
      {
        label: 'My Requests',
        href: '/requests',
        icon: ClipboardCheck,
        permissions: [],
      },
      {
        label: 'Approvals',
        href: '/approvals',
        icon: FileText,
        permissions: [{ action: 'APPROVE', resource: 'LEAVE_REQUEST' }],
      },
    ],
  },
  {
    category: 'Reports & Analytics',
    items: [
      {
        label: 'Reports',
        href: '/reports',
        icon: FileText, // changed from Calendar to FileText because Calendar is used below
        permissions: [{ action: 'APPROVE', resource: 'LEAVE_REQUEST' }],
      },
      {
        label: 'Audit Logs',
        href: '/admin/audit-logs',
        icon: Shield,
        permissions: [{ action: 'MANAGE', resource: 'USER' }],
      },
    ],
  },
  {
    category: 'Administration',
    items: [
      {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        permissions: [{ action: 'MANAGE', resource: 'USER' }],
      },
    ],
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed, isMobileMenuOpen, setIsMobileMenuOpen } = useSidebarLayout();
  const { theme, setTheme } = useTheme();

  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => apiRequestRaw<{ pendingRequests: number }>('/api/v1/dashboard', undefined, user?.id, user?.email),
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  const pendingApprovalsCount = dashboardQuery.data?.pendingRequests || 0;

  if (!user) return null;

  const visibleSections = navigationSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) return true; // public to all logged in
      return item.permissions.some(rp =>
        user.permissions?.some(up => up.action === rp.action && up.resource === rp.resource)
      );
    }),
  })).filter((section) => section.items.length > 0);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col z-50',
          // Desktop sidebar: w-56 default, w-20 when collapsed; Mobile overlay: w-56, hidden when menu closed
          'md:w-56 md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:-translate-x-0 hidden md:flex',
          isCollapsed && 'md:w-20'
        )}
      >
        {/* Logo */}
        <div className={cn('border-b border-sidebar-border flex items-center justify-between gap-2 relative', isCollapsed ? 'p-3 md:py-6' : 'p-6')}>
          <div className={cn('flex items-center gap-3', isCollapsed && 'md:justify-center md:w-full')}>
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-card flex items-center justify-center flex-shrink-0">
              <Image
                src="/logo.png"
                alt="UPHSM Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold text-sidebar-foreground leading-tight">University of Perpetual Help System</h1>
                <p className="text-xs text-muted-foreground">Manila</p>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          {isMobileMenuOpen && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-sidebar-accent/30 transition-colors text-muted-foreground"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={toggleCollapsed}
            className={cn(
              "hidden md:flex items-center justify-center p-1.5 rounded-lg transition-colors hover:bg-sidebar-accent/30 text-muted-foreground",
              isCollapsed && "mx-auto"
            )}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft className={cn("w-4 h-4", isCollapsed ? 'ml-1' : 'ml-0')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {visibleSections.map((section) => (
            <div key={section.category} className="mb-6">
              {!isCollapsed && (
                <div className="px-4 py-2 mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.category}
                  </p>
                </div>
              )}
              <div className={cn('space-y-1', isCollapsed && 'md:space-y-2')}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link key={item.href} href={item.href}>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/30',
                          isCollapsed && 'md:justify-center md:px-2',
                          item.label === 'Approvals' && 'relative'
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className="w-5 h-5" />
                        {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                        {item.label === 'Approvals' && pendingApprovalsCount > 0 && (
                          <Badge
                            variant="destructive"
                            className={cn(
                              "absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-1 text-[10px] tabular-nums font-bold border-2 border-sidebar",
                              !isCollapsed && "relative top-0 right-0 ml-auto h-5 min-w-5 border-0"
                            )}
                          >
                            {pendingApprovalsCount}
                          </Badge>
                        )}
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className={cn('p-4 border-t border-sidebar-border space-y-3', isCollapsed && 'md:space-y-2')}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors',
              isCollapsed && 'md:justify-center md:px-2'
            )}
            title={isCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-5 h-5" />
                {!isCollapsed && <span className="text-sm font-medium">Light Mode</span>}
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                {!isCollapsed && <span className="text-sm font-medium">Dark Mode</span>}
              </>
            )}
          </button>

          {!isCollapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-sidebar-accent/30 transition-colors">
                  <div className="text-left">
                    <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-2 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
