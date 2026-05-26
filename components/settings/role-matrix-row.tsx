'use client';

import React from 'react';
import { LucideIcon, Check, X } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

interface PermissionAction {
  id: string;
  action: string;
  resource: string;
}

interface RoleMatrixRowProps {
  resource: string;
  label: string;
  icon: LucideIcon;
  availableActions: PermissionAction[];
  selectedPermissionIds: string[];
  onToggle: (permissionId: string) => void;
  showOtherColumn?: boolean;
}

const ACTION_COLUMNS = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'];

const ACTION_LABELS: Record<string, string> = {
  READ: 'View',
  CREATE: 'Create',
  UPDATE: 'Edit',
  DELETE: 'Delete',
  APPROVE: 'Approve',
  MANAGE: 'Manage',
};

export function RoleMatrixRow({
  resource,
  label,
  icon: Icon,
  availableActions,
  selectedPermissionIds,
  onToggle,
  showOtherColumn = true,
}: RoleMatrixRowProps) {
  return (
    <TableRow className="hover:bg-muted/30 transition-colors group">
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
              {resource}
            </p>
          </div>
        </div>
      </TableCell>

      {ACTION_COLUMNS.map((actionName) => {
        // Find permission for this action or MANAGE which covers everything
        const permission = availableActions.find(
          (p) => p.action === actionName || (p.action === 'MANAGE' && ['CREATE', 'UPDATE', 'DELETE'].includes(actionName))
        );

        if (!permission && actionName !== 'APPROVE') {
          // If no specific action, check if there's a MANAGE permission for this resource
          const managePermission = availableActions.find((p) => p.action === 'MANAGE');
          if (!managePermission) {
             return <TableCell key={actionName} className="text-center">—</TableCell>;
          }
        }

        const isChecked = permission ? selectedPermissionIds.includes(permission.id) : false;
        const isManageAuto = !permission && availableActions.some(p => p.action === 'MANAGE' && selectedPermissionIds.includes(p.id));
        const finalChecked = isChecked || isManageAuto;

        if (!permission && !isManageAuto) {
           return <TableCell key={actionName} className="text-center">—</TableCell>;
        }

        // Use the actual permission ID if available, otherwise the MANAGE one
        const targetId = permission?.id || availableActions.find(p => p.action === 'MANAGE')?.id;

        return (
          <TableCell key={actionName} className="text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex justify-center transition-opacity",
                    isManageAuto && !permission && "opacity-60" // Dim it if it's inherited
                  )}>
                    <Checkbox
                      checked={finalChecked}
                      onCheckedChange={() => targetId && onToggle(targetId)}
                      disabled={isManageAuto && !permission && !targetId}
                      className={cn(
                        isManageAuto && !permission && "data-[state=checked]:bg-primary/50 border-dashed"
                      )}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">
                    {finalChecked ? 'Revoke' : 'Grant'} {ACTION_LABELS[actionName] || actionName} permission
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableCell>
        );
      })}

      {/* Catch-all for other special permissions not in columns */}
      {showOtherColumn && (
        <TableCell className="text-right">
          <div className="flex flex-wrap justify-end gap-1">
            {availableActions
              .filter((p) => !ACTION_COLUMNS.includes(p.action) && p.action !== 'MANAGE')
              .map((p) => (
                <Badge
                  key={p.id}
                  variant={selectedPermissionIds.includes(p.id) ? "default" : "outline"}
                  className={cn(
                    "text-[9px] cursor-pointer hover:opacity-80 transition-opacity uppercase px-1.5 py-0",
                    !selectedPermissionIds.includes(p.id) && "text-muted-foreground border-dashed"
                  )}
                  onClick={() => onToggle(p.id)}
                >
                  {p.action}
                </Badge>
              ))}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
