'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends React.ComponentProps<typeof Input> {
  showPassword?: boolean;
  onShowPasswordChange?: (show: boolean) => void;
  hideToggle?: boolean;
}

export function PasswordInput({ className, showPassword: externalShowPassword, onShowPasswordChange, hideToggle, ...props }: PasswordInputProps) {
  const [localShowPassword, setLocalShowPassword] = React.useState(false);
  
  const showPassword = externalShowPassword !== undefined ? externalShowPassword : localShowPassword;
  
  const togglePassword = () => {
    if (onShowPasswordChange) {
      onShowPasswordChange(!showPassword);
    } else {
      setLocalShowPassword((prev) => !prev);
    }
  };

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        className={cn(!hideToggle && 'pr-10', className)}
        {...props}
      />
      {!hideToggle && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
          onClick={togglePassword}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">
            {showPassword ? 'Hide password' : 'Show password'}
          </span>
        </Button>
      )}
    </div>
  );
}
