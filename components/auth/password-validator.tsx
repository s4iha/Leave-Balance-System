'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordValidatorProps {
  password: string;
}

export function PasswordValidator({ password }: PasswordValidatorProps) {
  const requirements = [
    { label: 'At least 8 characters', regex: /.{8,}/ },
    { label: 'Contains one lowercase letter', regex: /[a-z]/ },
    { label: 'Contains one uppercase letter', regex: /[A-Z]/ },
    { label: 'Contains one number', regex: /[0-9]/ },
    { label: 'Contains one special character (@, #, $, %, etc.)', regex: /[^A-Za-z0-9]/ },
  ];

  return (
    <div className="space-y-1.5 py-2">
      {requirements.map((req, index) => {
        const isMet = req.regex.test(password);
        return (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors duration-200",
              isMet ? "text-green-600" : "text-destructive"
            )}
          >
            {isMet ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            <span>{req.label}</span>
          </div>
        );
      })}
    </div>
  );
}
