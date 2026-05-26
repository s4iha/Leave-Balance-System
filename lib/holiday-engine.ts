import { prisma } from './db';
import { HolidayDefinition, OffsetRule, RuleType } from './prisma';
import { 
  addDays, 
  subDays, 
  isWeekend, 
  getDay, 
  format,
  eachDayOfInterval
} from 'date-fns';

export class HolidayEngine {
  /**
   * Applies the selected offset rule to an actual holiday date.
   */
  static applyOffset(date: Date, offsetRule: OffsetRule): Date {
    if (offsetRule === OffsetRule.NEXT_MONDAY_IF_WEEKEND && isWeekend(date)) {
      if (getDay(date) === 6) return addDays(date, 2); // Saturday -> Monday
      if (getDay(date) === 0) return addDays(date, 1); // Sunday -> Monday
    }
    if (offsetRule === OffsetRule.PREV_FRIDAY_IF_WEEKEND && isWeekend(date)) {
      if (getDay(date) === 6) return subDays(date, 1); // Saturday -> Friday
      if (getDay(date) === 0) return subDays(date, 2); // Sunday -> Friday
    }
    return date;
  }

  /**
   * Calculates the actual date of a holiday for a specific year.
   */
  static calculateDateForRule(year: number, def: HolidayDefinition): Date | null {
    if (def.ruleType === RuleType.FIXED_DATE) {
      if (def.month == null || def.day == null) return null;
      // month is 1-indexed in UI/Schema if we consider 1=Jan, 12=Dec. Assuming 1-12.
      return new Date(year, def.month - 1, def.day);
    }
    
    if (def.ruleType === RuleType.NTH_WEEKDAY) {
      if (def.month == null || def.weekday == null || def.nth == null) return null;
      // weekday: 0=Sun, 1=Mon, ..., 6=Sat
      const firstOfMonth = new Date(year, def.month - 1, 1);
      
      if (def.nth > 0) {
        let current = firstOfMonth;
        let count = 0;
        while (current.getMonth() === def.month - 1) {
          if (getDay(current) === def.weekday) {
            count++;
            if (count === def.nth) return current;
          }
          current = addDays(current, 1);
        }
      } else if (def.nth === -1) {
        // Last weekday of the month
        let current = new Date(year, def.month, 0); // Last day of month
        while (current.getMonth() === def.month - 1) {
          if (getDay(current) === def.weekday) {
            return current;
          }
          current = subDays(current, 1);
        }
      }
    }
    
    // For RELATIVE_RULE, we'd need more complex parsing. Skip for MVP unless specifically defined.
    return null;
  }

  /**
   * Generates or updates occurrences for a specific year based on active definitions.
   * This function is idempotent.
   */
  static async generateHolidaysForYear(year: number): Promise<void> {
    const definitions = await prisma.holidayDefinition.findMany({
      where: { isActive: true, ruleType: { not: RuleType.MANUAL_ONLY } }
    });

    for (const def of definitions) {
      const calculatedDate = this.calculateDateForRule(year, def);
      if (calculatedDate) {
        const observedDate = this.applyOffset(calculatedDate, def.offsetRule);
        
        await prisma.holidayOccurrence.upsert({
          where: {
            definitionId_year: {
              definitionId: def.id,
              year: year
            }
          },
          update: {
            date: calculatedDate,
            observedDate: observedDate
          },
          create: {
            definitionId: def.id,
            date: calculatedDate,
            observedDate: observedDate,
            year: year
          }
        });
      }
    }
  }

  /**
   * Lazily fetches and returns a Set of observed holiday dates for a year (formatted as YYYY-MM-DD).
   */
  static async getObservedHolidays(year: number): Promise<Set<string>> {
    // Lazy Generation check
    const occurrenceCount = await prisma.holidayOccurrence.count({
      where: { year }
    });
    
    if (occurrenceCount === 0) {
      // Trigger generation if no occurrences exist for the year
      await this.generateHolidaysForYear(year);
    }

    const occurrences = await prisma.holidayOccurrence.findMany({
      where: { year },
      select: { observedDate: true }
    });

    const manualHolidays = await prisma.manualHoliday.findMany({
      where: { year },
      select: { date: true }
    });

    const dates = new Set<string>();
    occurrences.forEach(o => dates.add(format(o.observedDate, 'yyyy-MM-dd')));
    manualHolidays.forEach(m => dates.add(format(m.date, 'yyyy-MM-dd')));

    return dates;
  }

  /**
   * Calculates working days excluding weekends and observed holidays.
   */
  static async calculateNetDuration(start: Date, end: Date): Promise<number> {
    const startY = start.getFullYear();
    const endY = end.getFullYear();
    
    let holidays = new Set<string>();
    for (let y = startY; y <= endY; y++) {
      const h = await this.getObservedHolidays(y);
      h.forEach(dateStr => holidays.add(dateStr));
    }

    let netDays = 0;
    const days = eachDayOfInterval({ start, end });
    
    for (const day of days) {
      if (isWeekend(day)) continue;
      if (holidays.has(format(day, 'yyyy-MM-dd'))) continue;
      netDays++;
    }
    
    return netDays;
  }
}
