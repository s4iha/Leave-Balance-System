'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Edit, Plus, Trash2 } from 'lucide-react';
import { apiRequestRaw } from '@/lib/api-client';
import { toast, showErrorToast } from '@/lib/sonner-toast';
import { SkeletonTable } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { RuleType, OffsetRule } from '@/generated/prisma/enums';

interface HolidayDefinition {
  id: string;
  name: string;
  ruleType: RuleType;
  month: number | null;
  day: number | null;
  weekday: number | null;
  nth: number | null;
  offsetRule: OffsetRule;
  isActive: boolean;
}

interface ManualHoliday {
  id: string;
  name: string;
  date: string;
  year: number;
  notes: string | null;
}

const ruleTypeLabels: Record<RuleType, string> = {
  FIXED_DATE: 'Fixed Date',
  NTH_WEEKDAY: 'Nth Weekday',
  RELATIVE_RULE: 'Relative Rule',
  MANUAL_ONLY: 'Manual Only',
};

const offsetRuleLabels: Record<OffsetRule, string> = {
  NONE: 'None',
  NEXT_MONDAY_IF_WEEKEND: 'Next Monday if Weekend',
  PREV_FRIDAY_IF_WEEKEND: 'Previous Friday if Weekend',
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const weekdays = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export function HolidaysTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('rules');
  const [currentYear] = useState(new Date().getFullYear());

  // Pagination State
  const [rulesPage, setRulesPage] = useState(1);
  const [manualPage, setManualPage] = useState(1);
  const itemsPerPage = 10;

  // Rule State
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<HolidayDefinition | null>(null);
  const [selectedRule, setSelectedRule] = useState<HolidayDefinition | null>(null);
  
  const [ruleFormData, setRuleFormData] = useState<Partial<HolidayDefinition>>({
    name: '',
    ruleType: RuleType.FIXED_DATE,
    offsetRule: OffsetRule.NONE,
    isActive: true,
  });

  // Manual State
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [manualToDelete, setManualToDelete] = useState<ManualHoliday | null>(null);
  const [selectedManual, setSelectedManual] = useState<ManualHoliday | null>(null);
  
  const [manualFormData, setManualFormData] = useState<{name: string, date: string, notes: string}>({
    name: '',
    date: '',
    notes: ''
  });

  // Queries
  const definitionsQuery = useQuery({
    queryKey: ['holiday-definitions'],
    queryFn: () => apiRequestRaw<{ data: HolidayDefinition[] }>('/api/v1/holidays/definitions', {}, user?.id, user?.email),
  });

  const manualHolidaysQuery = useQuery({
    queryKey: ['manual-holidays', currentYear],
    queryFn: () => apiRequestRaw<{ data: ManualHoliday[] }>(`/api/v1/holidays/manual?year=${currentYear}`, {}, user?.id, user?.email),
  });

  // Mutations
  const createRuleMutation = useMutation({
    mutationFn: (payload: any) => apiRequestRaw('/api/v1/holidays/definitions', { method: 'POST', body: JSON.stringify(payload) }, user?.id, user?.email),
    onSuccess: () => { toast({ title: 'Rule created' }); setIsRuleDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['holiday-definitions']}); }
  });

  const updateRuleMutation = useMutation({
    mutationFn: (payload: any) => apiRequestRaw(`/api/v1/holidays/definitions/${payload.id}`, { method: 'PATCH', body: JSON.stringify(payload) }, user?.id, user?.email),
    onSuccess: () => { toast({ title: 'Rule updated' }); setIsRuleDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['holiday-definitions']}); }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => apiRequestRaw(`/api/v1/holidays/definitions/${id}`, { method: 'DELETE' }, user?.id, user?.email),
    onSuccess: () => { toast({ title: 'Rule deleted' }); setRuleToDelete(null); queryClient.invalidateQueries({ queryKey: ['holiday-definitions']}); }
  });

  const createManualMutation = useMutation({
    mutationFn: (payload: any) => apiRequestRaw('/api/v1/holidays/manual', { method: 'POST', body: JSON.stringify(payload) }, user?.id, user?.email),
    onSuccess: () => { toast({ title: 'Manual holiday created' }); setIsManualDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['manual-holidays']}); }
  });

  const updateManualMutation = useMutation({
    mutationFn: (payload: any) => apiRequestRaw(`/api/v1/holidays/manual/${payload.id}`, { method: 'PATCH', body: JSON.stringify(payload) }, user?.id, user?.email),
    onSuccess: () => { toast({ title: 'Manual holiday updated' }); setIsManualDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['manual-holidays']}); }
  });

  const deleteManualMutation = useMutation({
    mutationFn: (id: string) => apiRequestRaw(`/api/v1/holidays/manual/${id}`, { method: 'DELETE' }, user?.id, user?.email),
    onSuccess: () => { toast({ title: 'Manual holiday deleted' }); setManualToDelete(null); queryClient.invalidateQueries({ queryKey: ['manual-holidays']}); }
  });

  const definitions = definitionsQuery.data?.data || [];
  const manualHolidays = manualHolidaysQuery.data?.data || [];

  const totalRulesPages = Math.ceil(definitions.length / itemsPerPage);
  const totalManualPages = Math.ceil(manualHolidays.length / itemsPerPage);

  const paginatedRules = definitions.slice((rulesPage - 1) * itemsPerPage, rulesPage * itemsPerPage);
  const paginatedManual = manualHolidays.slice((manualPage - 1) * itemsPerPage, manualPage * itemsPerPage);

  const isSavingRule = createRuleMutation.isPending || updateRuleMutation.isPending;
  const isSavingManual = createManualMutation.isPending || updateManualMutation.isPending;

  // Handlers
  const handleSaveRule = () => {
    if (!ruleFormData.name) return showErrorToast('Name required', 'Validation Error');
    if (selectedRule) {
      updateRuleMutation.mutate({ ...ruleFormData, id: selectedRule.id });
    } else {
      createRuleMutation.mutate(ruleFormData);
    }
  };

  const handleSaveManual = () => {
    if (!manualFormData.name || !manualFormData.date) return showErrorToast('Name and date required', 'Validation Error');
    const payload = {
      name: manualFormData.name,
      date: new Date(manualFormData.date).toISOString(),
      notes: manualFormData.notes
    };
    if (selectedManual) {
      updateManualMutation.mutate({ ...payload, id: selectedManual.id });
    } else {
      createManualMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Holiday Engine</h2>
          <p className="text-muted-foreground text-sm">Configure rule-based non-working days or manual exceptions.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="rules">Recurring Rules</TabsTrigger>
          <TabsTrigger value="manual">Manual Exceptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules" className="space-y-4 mt-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">Holiday Rules</CardTitle>
                <CardDescription>Rules dynamically generate holidays every year.</CardDescription>
              </div>
              <Button onClick={() => { setSelectedRule(null); setRuleFormData({ name: '', ruleType: RuleType.FIXED_DATE, offsetRule: OffsetRule.NONE, isActive: true }); setIsRuleDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Rule
              </Button>
            </CardHeader>
            <CardContent>
              {definitionsQuery.isLoading ? <SkeletonTable rows={3} columns={5} /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Configuration</TableHead>
                      <TableHead>Offset</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRules.map((def) => (
                      <TableRow key={def.id}>
                        <TableCell className="font-medium">{def.name}</TableCell>
                        <TableCell><Badge variant="outline">{ruleTypeLabels[def.ruleType]}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {def.ruleType === RuleType.FIXED_DATE && `${months[(def.month||1)-1]} ${def.day}`}
                          {def.ruleType === RuleType.NTH_WEEKDAY && `${def.nth === -1 ? 'Last' : def.nth} ${weekdays[def.weekday||0]} of ${months[(def.month||1)-1]}`}
                        </TableCell>
                        <TableCell className="text-sm">{offsetRuleLabels[def.offsetRule]}</TableCell>
                        <TableCell><Badge variant={def.isActive ? 'default' : 'secondary'}>{def.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedRule(def); setRuleFormData(def); setIsRuleDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRuleToDelete(def)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {definitions.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No rules configured.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              {/* Rules Pagination */}
              {totalRulesPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (rulesPage > 1) setRulesPage(rulesPage - 1);
                          }}
                          className={rulesPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalRulesPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={rulesPage === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setRulesPage(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (rulesPage < totalRulesPages) setRulesPage(rulesPage + 1);
                          }}
                          className={rulesPage === totalRulesPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4 mt-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">Manual Exceptions ({currentYear})</CardTitle>
                <CardDescription>One-off holidays for specific dates.</CardDescription>
              </div>
              <Button onClick={() => { setSelectedManual(null); setManualFormData({ name: '', date: '', notes: '' }); setIsManualDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Exception
              </Button>
            </CardHeader>
            <CardContent>
              {manualHolidaysQuery.isLoading ? <SkeletonTable rows={3} columns={4} /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedManual.map((holiday) => (
                      <TableRow key={holiday.id}>
                        <TableCell className="font-medium">{format(new Date(holiday.date), 'MMMM d, yyyy')}</TableCell>
                        <TableCell>{holiday.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{holiday.notes || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedManual(holiday); setManualFormData({ name: holiday.name, date: holiday.date.split('T')[0], notes: holiday.notes || '' }); setIsManualDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setManualToDelete(holiday)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {manualHolidays.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No manual exceptions for this year.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              {/* Manual Pagination */}
              {totalManualPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (manualPage > 1) setManualPage(manualPage - 1);
                          }}
                          className={manualPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalManualPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={manualPage === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setManualPage(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (manualPage < totalManualPages) setManualPage(manualPage + 1);
                          }}
                          className={manualPage === totalManualPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRule ? 'Edit Rule' : 'New Rule'}</DialogTitle>
            <DialogDescription>
              {selectedRule 
                ? 'Update the recurring logic for this holiday. Changes will apply to all future years.' 
                : 'Define a recurring rule to automatically generate holidays based on fixed dates or relative weekday logic.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={ruleFormData.name} onChange={(e) => setRuleFormData({...ruleFormData, name: e.target.value})} placeholder="Christmas Day" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Rule Type</label>
              <Select value={ruleFormData.ruleType} onValueChange={(v) => setRuleFormData({...ruleFormData, ruleType: v as RuleType})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={RuleType.FIXED_DATE}>Fixed Date</SelectItem>
                  <SelectItem value={RuleType.NTH_WEEKDAY}>Nth Weekday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ruleFormData.ruleType === RuleType.FIXED_DATE && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <Select value={String(ruleFormData.month || 1)} onValueChange={(v) => setRuleFormData({...ruleFormData, month: parseInt(v)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {months.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Day</label>
                  <Input type="number" min="1" max="31" value={ruleFormData.day || ''} onChange={(e) => setRuleFormData({...ruleFormData, day: parseInt(e.target.value)})} />
                </div>
              </div>
            )}

            {ruleFormData.ruleType === RuleType.NTH_WEEKDAY && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nth</label>
                  <Select value={String(ruleFormData.nth || 1)} onValueChange={(v) => setRuleFormData({...ruleFormData, nth: parseInt(v)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st</SelectItem>
                      <SelectItem value="2">2nd</SelectItem>
                      <SelectItem value="3">3rd</SelectItem>
                      <SelectItem value="4">4th</SelectItem>
                      <SelectItem value="-1">Last</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Weekday</label>
                  <Select value={String(ruleFormData.weekday || 1)} onValueChange={(v) => setRuleFormData({...ruleFormData, weekday: parseInt(v)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {weekdays.map((w, i) => <SelectItem key={i} value={String(i)}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <Select value={String(ruleFormData.month || 1)} onValueChange={(v) => setRuleFormData({...ruleFormData, month: parseInt(v)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {months.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m.substring(0,3)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Offset Rule (Weekends)</label>
              <Select value={ruleFormData.offsetRule} onValueChange={(v) => setRuleFormData({...ruleFormData, offsetRule: v as OffsetRule})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={OffsetRule.NONE}>Do not offset</SelectItem>
                  <SelectItem value={OffsetRule.NEXT_MONDAY_IF_WEEKEND}>Observe on Next Monday</SelectItem>
                  <SelectItem value={OffsetRule.PREV_FRIDAY_IF_WEEKEND}>Observe on Prev Friday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border rounded p-3">
              <span className="text-sm font-medium">Active</span>
              <Switch checked={ruleFormData.isActive} onCheckedChange={(v) => setRuleFormData({...ruleFormData, isActive: v})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRule} disabled={isSavingRule} className="text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Dialog */}
      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedManual ? 'Edit Exception' : 'New Exception'}</DialogTitle>
            <DialogDescription>
              {selectedManual
                ? 'Modify the specific date or notes for this one-off holiday exception.'
                : 'Add a specific date that should be treated as a holiday for the current year only.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={manualFormData.name} onChange={(e) => setManualFormData({...manualFormData, name: e.target.value})} placeholder="Special Holiday" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={manualFormData.date} onChange={(e) => setManualFormData({...manualFormData, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input value={manualFormData.notes} onChange={(e) => setManualFormData({...manualFormData, notes: e.target.value})} placeholder="Reason for exception..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveManual} disabled={isSavingManual} className="text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alerts */}
      <AlertDialog open={!!ruleToDelete} onOpenChange={(o) => !o && setRuleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {ruleToDelete?.name}? This will affect future calculations.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => ruleToDelete && deleteRuleMutation.mutate(ruleToDelete.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!manualToDelete} onOpenChange={(o) => !o && setManualToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exception</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {manualToDelete?.name}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => manualToDelete && deleteManualMutation.mutate(manualToDelete.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
