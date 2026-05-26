import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HolidayEngine } from './holiday-engine';
import { RuleType, OffsetRule } from './prisma';

describe('HolidayEngine', () => {
  describe('applyOffset', () => {
    it('should offset to Monday if rule is NEXT_MONDAY_IF_WEEKEND and date is Saturday', () => {
      const saturday = new Date(2024, 0, 6); // Jan 6, 2024
      const result = HolidayEngine.applyOffset(saturday, OffsetRule.NEXT_MONDAY_IF_WEEKEND);
      assert.strictEqual(result.getDay(), 1);
      assert.strictEqual(result.getDate(), 8);
    });

    it('should offset to Monday if rule is NEXT_MONDAY_IF_WEEKEND and date is Sunday', () => {
      const sunday = new Date(2024, 0, 7); // Jan 7, 2024
      const result = HolidayEngine.applyOffset(sunday, OffsetRule.NEXT_MONDAY_IF_WEEKEND);
      assert.strictEqual(result.getDay(), 1);
      assert.strictEqual(result.getDate(), 8);
    });

    it('should offset to Friday if rule is PREV_FRIDAY_IF_WEEKEND and date is Saturday', () => {
      const saturday = new Date(2024, 0, 6); // Jan 6, 2024
      const result = HolidayEngine.applyOffset(saturday, OffsetRule.PREV_FRIDAY_IF_WEEKEND);
      assert.strictEqual(result.getDay(), 5);
      assert.strictEqual(result.getDate(), 5);
    });

    it('should offset to Friday if rule is PREV_FRIDAY_IF_WEEKEND and date is Sunday', () => {
      const sunday = new Date(2024, 0, 7); // Jan 7, 2024
      const result = HolidayEngine.applyOffset(sunday, OffsetRule.PREV_FRIDAY_IF_WEEKEND);
      assert.strictEqual(result.getDay(), 5);
      assert.strictEqual(result.getDate(), 5);
    });

    it('should not offset if date is a weekday', () => {
      const wednesday = new Date(2024, 0, 3); // Jan 3, 2024
      const result = HolidayEngine.applyOffset(wednesday, OffsetRule.NEXT_MONDAY_IF_WEEKEND);
      assert.strictEqual(result.getDay(), 3);
      assert.strictEqual(result.getDate(), 3);
    });
  });

  describe('calculateDateForRule', () => {
    it('should correctly calculate a FIXED_DATE holiday', () => {
      const def = {
        id: '1', name: 'Fixed', ruleType: RuleType.FIXED_DATE, 
        month: 12, day: 25, weekday: null, nth: null, 
        offsetRule: OffsetRule.NONE, isActive: true, 
        createdAt: new Date(), updatedAt: new Date()
      };
      const result = HolidayEngine.calculateDateForRule(2024, def);
      assert.ok(result);
      assert.strictEqual(result.getFullYear(), 2024);
      assert.strictEqual(result.getMonth(), 11); // December (0-indexed)
      assert.strictEqual(result.getDate(), 25);
    });

    it('should correctly calculate NTH_WEEKDAY holiday (First Monday)', () => {
      const def = {
        id: '2', name: 'Labor', ruleType: RuleType.NTH_WEEKDAY, 
        month: 9, day: null, weekday: 1, nth: 1, // 1st Monday of September
        offsetRule: OffsetRule.NONE, isActive: true, 
        createdAt: new Date(), updatedAt: new Date()
      };
      const result = HolidayEngine.calculateDateForRule(2024, def);
      assert.ok(result);
      assert.strictEqual(result.getFullYear(), 2024);
      assert.strictEqual(result.getMonth(), 8); // September
      assert.strictEqual(result.getDate(), 2); // Sept 2, 2024 is the 1st Monday
    });

    it('should correctly calculate NTH_WEEKDAY holiday (Last Friday)', () => {
      const def = {
        id: '3', name: 'Last Friday', ruleType: RuleType.NTH_WEEKDAY, 
        month: 5, day: null, weekday: 5, nth: -1, // Last Friday of May
        offsetRule: OffsetRule.NONE, isActive: true, 
        createdAt: new Date(), updatedAt: new Date()
      };
      const result = HolidayEngine.calculateDateForRule(2024, def);
      assert.ok(result);
      assert.strictEqual(result.getFullYear(), 2024);
      assert.strictEqual(result.getMonth(), 4); // May
      assert.strictEqual(result.getDate(), 31); // May 31, 2024 is the last Friday
    });
  });
});
