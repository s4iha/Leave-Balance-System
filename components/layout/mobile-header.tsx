'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useSidebarLayout } from '@/components/layout/sidebar-context';
import { cn } from '@/lib/utils';

export function MobileHeader() {
  const { isMobileMenuOpen, toggleMobileMenu } = useSidebarLayout();

  return (
    <div className={cn(
      "md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border",
      isMobileMenuOpen && "hidden"
    )}>
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo and University Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-card flex items-center justify-center flex-shrink-0">
            <Image
              src="/logo.png"
              alt="UPHSM Logo"
              width={32}
              height={32}
              className="w-6 h-6"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-sidebar-foreground truncate">University of Perpetual Help System</h1>
            <p className="text-xs text-muted-foreground truncate">Manila</p>
          </div>
        </div>

        {/* Hamburger Menu */}
        <button
          onClick={toggleMobileMenu}
          className="ml-4 p-2 rounded-lg hover:bg-sidebar-accent/30 transition-colors text-sidebar-foreground flex-shrink-0"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}
