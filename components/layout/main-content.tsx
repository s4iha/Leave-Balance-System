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
        // Mobile: no margin (sidebar is overlay)
        // Desktop: respond to collapsed state
        isCollapsed ? 'md:ml-20' : 'md:ml-64',
        'ml-0',
        className
      )}
    >
      {children}
    </main>
  );
}
