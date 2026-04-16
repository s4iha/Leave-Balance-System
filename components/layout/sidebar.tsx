'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from 'next-themes';
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
        roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
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
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        label: 'Departments',
        href: '/departments',
        icon: Building2,
        roles: ['ADMIN'],
      },
      {
        label: 'Leave Types',
        href: '/leave-types',
        icon: Briefcase,
        roles: ['ADMIN'],
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
        roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      },
      {
        label: 'Approvals',
        href: '/approvals',
        icon: FileText,
        roles: ['ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    category: 'Reports & Analytics',
    items: [
      {
        label: 'Reports',
        href: '/reports',
        icon: Calendar,
        roles: ['ADMIN', 'MANAGER'],
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
        roles: ['ADMIN'],
      },
      {
        label: 'User Access',
        href: '/admin/user-access',
        icon: Shield,
        roles: ['ADMIN'],
      },
    ],
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  const visibleSections = navigationSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(user.role)),
  })).filter((section) => section.items.length > 0);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 md:hidden bg-sidebar-primary text-sidebar-primary-foreground p-2 rounded-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out flex flex-col',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-0 hidden md:flex'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-sm font-bold text-sidebar-foreground">UPHS - Manila</h1>
              <p className="text-xs text-muted-foreground">Leave System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {visibleSections.map((section) => (
            <div key={section.category} className="mb-6">
              <div className="px-4 py-2 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.category}
                </p>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link key={item.href} href={item.href}>
                      <button
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/30'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-5 h-5" />
                <span className="text-sm font-medium">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                <span className="text-sm font-medium">Dark Mode</span>
              </>
            )}
          </button>

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
              <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
