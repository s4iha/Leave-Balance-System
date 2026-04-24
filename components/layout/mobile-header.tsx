'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface MobileHeaderProps {
  onMenuClick?: (isOpen: boolean) => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuClick = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onMenuClick?.(newState);
  };

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border">
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
          onClick={handleMenuClick}
          className="ml-4 p-2 rounded-lg hover:bg-sidebar-accent/30 transition-colors text-sidebar-foreground flex-shrink-0"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}
