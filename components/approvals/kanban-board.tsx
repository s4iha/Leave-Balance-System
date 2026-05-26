'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Clock, CheckCircle2, XCircle, MoreVertical } from 'lucide-react';
import { LeaveRequestStatus } from '@/generated/prisma/enums';
import { DateFormatter } from '@/components/date-formatter';
import { cn } from '@/lib/utils';

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  status: LeaveRequestStatus;
  createdAt: string;
  approvalDate: string | null;
  approvalNotes: string | null;
  employee: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
  leaveType: {
    name: string;
  };
}

interface KanbanBoardProps {
  requests: LeaveRequest[];
  onSelectRequest: (request: LeaveRequest) => void;
  isLoading?: boolean;
}

const COLUMNS = [
  { id: LeaveRequestStatus.SUBMITTED, title: 'Pending', color: 'bg-amber-500', icon: Clock },
  { id: LeaveRequestStatus.APPROVED, title: 'Approved', color: 'bg-green-500', icon: CheckCircle2 },
  { id: LeaveRequestStatus.REJECTED, title: 'Rejected', color: 'bg-red-500', icon: XCircle },
];

export function KanbanBoard({ requests, onSelectRequest, isLoading }: KanbanBoardProps) {
  const getRequestsByStatus = (status: LeaveRequestStatus) => {
    return requests.filter((r) => r.status === status);
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 min-h-[70vh] scrollbar-hide">
      {COLUMNS.map((column) => {
        const columnRequests = getRequestsByStatus(column.id);
        const Icon = column.icon;
        
        return (
          <div key={column.id} className="flex-shrink-0 w-80 md:w-96 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className={cn("p-1.5 rounded-lg text-white shadow-sm", column.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-foreground tracking-tight text-sm">
                  {column.title}
                </h3>
                <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {columnRequests.length}
                </span>
              </div>
            </div>

            <div className="bg-muted/30 rounded-2xl p-3 flex-1 space-y-4 min-h-[500px] border border-border/50">
              {columnRequests.map((request) => (
                <Card
                  key={request.id}
                  onClick={() => onSelectRequest(request)}
                  className="p-4 cursor-pointer hover:shadow-lg transition-all border-border/50 hover:border-primary/30 group bg-card relative overflow-hidden"
                >
                    {/* Decorative side bar */}
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", column.color)} />
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-sm border border-primary/10">
                                    {request.employee.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                                        {request.employee.user.name}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground font-medium truncate">
                                        {request.employee.user.email}
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] h-5 px-2 bg-background/50 backdrop-blur-sm border-border/50">
                                {request.leaveType.name}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                <span className="font-medium">
                                    <DateFormatter date={request.startDate} format="MMM d" />
                                    {' - '}
                                    <DateFormatter date={request.endDate} format="MMM d, yyyy" />
                                </span>
                                <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1.5 font-bold">
                                    {request.durationDays}d
                                </Badge>
                            </div>
                            
                            {request.reason && (
                                <p className="text-[11px] text-muted-foreground line-clamp-2 px-1">
                                    &quot;{request.reason}&quot;
                                </p>
                            )}
                        </div>

                        <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                            <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full border-2 border-card bg-primary/10 flex items-center justify-center">
                                    <User className="w-3 h-3 text-primary" />
                                </div>
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <DateFormatter date={request.startDate} format="relative" />
                            </span>
                        </div>
                    </div>
                </Card>
              ))}
              
              {columnRequests.length === 0 && !isLoading && (
                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl bg-background/20">
                  <Icon className="w-6 h-6 text-muted-foreground/30 mb-2" />
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">No {column.title.toLowerCase()} requests</p>
                </div>
              )}

              {isLoading && (
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
                    ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
}
