'use client';

import { useSidebarLayout } from '@/components/layout/sidebar-context';
import { cn } from '@/lib/utils';

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MainContent({ children, className }: MainContentProps) {
  const { isCollapsed } = useSidebarLayout();

  return (
    <main
      className={cn(
        'flex-1 overflow-auto transition-all duration-300',
        // Mobile: add top padding for mobile header and horizontal padding
        'pt-16 px-4 md:pt-0 md:px-0',
        // Desktop: respond to collapsed state (w-20 when collapsed, w-56 when expanded)
        isCollapsed ? 'md:ml-20' : 'md:ml-56',
        'ml-0',
        className
      )}
    >
      {children}
    </main>
  );
}
