'use client'

import * as React from 'react'
import { format, addDays } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type DateRangePreset =
  | { label: string; days: number }
  | { label: string; type: 'this-month' | 'last-month' }
  | { label: string; range: (now: Date) => DateRange }

const defaultPresets: DateRangePreset[] = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: -1 },
  { label: 'Last 7 Days', days: -7 },
  { label: 'Last 30 Days', days: -30 },
  { label: 'This Month', type: 'this-month' },
  { label: 'Last Month', type: 'last-month' },
]

export function DatePickerWithRange({
  className,
  date,
  setDate,
  presets = defaultPresets,
  minDate,
  popoverAlign = 'start',
  popoverSide = 'bottom',
  popoverSideOffset = 12,
  popoverCollisionPadding = 12,
}: {
  className?: string
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  presets?: DateRangePreset[]
  minDate?: Date
  popoverAlign?: 'start' | 'center' | 'end'
  popoverSide?: 'top' | 'right' | 'bottom' | 'left'
  popoverSideOffset?: number
  popoverCollisionPadding?: number
}) {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const handlePresetClick = (preset: DateRangePreset) => {
    const now = new Date()
    let range: DateRange | undefined

    if ('range' in preset) {
      range = preset.range(now)
    } else if ('days' in preset && typeof preset.days === 'number') {
      const from = preset.days <= 0 ? addDays(now, preset.days) : now
      const to = preset.days >= 0 ? addDays(now, preset.days) : now
      range = { from, to }
    } else if ('type' in preset) {
      if (preset.type === 'this-month') {
        range = { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now }
      } else if (preset.type === 'last-month') {
        range = {
          from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          to: new Date(now.getFullYear(), now.getMonth(), 0),
        }
      }
    }

    if (!range) return

    if (minDate && range.from && range.from < minDate) {
      range = {
        from: minDate,
        to: range.to && range.to < minDate ? minDate : range.to,
      }
    }

    setDate(range)
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal bg-muted border-input hover:bg-muted/80 transition-colors',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] p-0 z-[100] sm:w-auto sm:max-w-none"
          align={popoverAlign}
          side={popoverSide}
          sideOffset={popoverSideOffset}
          collisionPadding={popoverCollisionPadding}
        >
          <div className="flex max-h-[80vh] flex-col sm:flex-row items-stretch overflow-y-auto bg-popover rounded-md shadow-xl border border-border">
            {/* Presets Column */}
            <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-border p-3 gap-1 bg-muted/20 min-w-[140px]">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-2 mb-1">
                Quick Selection
              </div>
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs font-medium h-8 hover:bg-background hover:text-primary transition-colors"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Calendar Section */}
            <div className="flex flex-col overflow-hidden">
              <div className="grid grid-cols-2 text-center border-b border-border text-[10px] font-bold uppercase tracking-widest py-3 bg-muted/10 text-muted-foreground">
                <div className="flex items-center justify-center gap-2 border-r border-border/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Start Date
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> End Date
                </div>
              </div>
              <div className="p-1">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={isMobile ? 1 : 2}
                  disabled={minDate ? { before: minDate } : undefined}
                  className="p-3"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
