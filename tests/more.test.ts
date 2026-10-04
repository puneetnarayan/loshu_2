import { describe, expect, it } from 'vitest';
import { RULES } from '../src/data/catalogue';
import { buildReport, personalMonths, personalYear, relationOf, RELATION_TABLE, yearGrid, analyse, DIGITS } from '../src/loshu';
import { reportBlocks } from '../src/report/blocks';
import { dobOf } from './helpers';

const AS_OF = new Date(2026, 9, 4);
const ids = (r: ReturnType<typeof buildReport>) => r.triggered.map((t) => t.rule.id).sort();

describe('personal months', () => {
  it('reproduces the worked example in a source summary: born 22 June, April 2026 gives 6', () => {
    const py = personalYear(dobOf('22-06-1990'), 2026).personalYear; // 2+2+6+2+0+2+6 = 20 -> 2
    expect(py.value).toBe(2);
    expect(personalMonths(py)[3]).toMatchObject({ month: 4, value: 6, steps: ['2 + 4 = 6'] });
    expect(personalMonths(py)[11]).toMatchObject({ month: 12, value: 5, steps: ['2 + 12 = 14', '1 + 4 = 5'] });
  });
  it('for Personal Year 9 every month equals the digital root of the month number', () => {
    const py = personalYear(dobOf('02-06-1970'), 2026).personalYear;
    expect(py.value).toBe(9);
    expect(personalMonths(py).map((m) => m.value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3]);
  });
});

describe('year grid (descriptive arithmetic)', () => {
  it('23-11-1994 + 2026: adds 2, 2, 6; no line becomes complete or non-empty', () => {
    const yg = yearGrid(analyse(dobOf('23-11-1994')), 2026);
    expect(yg.addedDigits).toEqual([2, 2, 6]); // the 0 is excluded
    expect(yg.counts).toMatchObject({ 2: 3, 6: 1, 1: 3, 9: 2 });
    expect(yg.newlyComplete).toEqual([]);
    expect(yg.newlyNonEmpty).toEqual([]);
    expect(yg.statusChanges).toEqual([{ digit: 2, before: 1, after: 3 }, { digit: 6, before: 0, after: 1 }]);
  });
  it('05-05-2005 + 2026: 6 appears, so the empty 8-1-6 line becomes partial', () => {
    const yg = yearGrid(analyse(dobOf('05-05-2005')), 2026);
    expect(yg.newlyNonEmpty).toEqual(['H-816']);
    expect(yg.newlyComplete).toEqual([]);
    expect(yg.lines.find((l) => l.id === 'V-438')).toMatchObject({ before: 'empty', after: 'empty' });
  });
  it('never mutates the raw audit', () => {
    const a = analyse(dobOf('05-05-2005'));
    const before = JSON.stringify(a.audit);
    yearGrid(a, 2030);
    expect(JSON.stringify(a.audit)).toBe(before);
  });
});

describe('Driver-Destiny relation table (one inconsistent source)', () => {
  it('looks up each column of a row', () => {
    expect(relationOf(1, 2)).toBe('friendly');
    expect(relationOf(1, 4)).toBe('neutral');
    expect(relationOf(1, 8)).toBe('enemy');
    expect(relationOf(3, 6)).toBe('enemy');
    expect(relationOf(5, 5)).toBe('friendly');
  });
  it('every pair resolves, and exactly one pair is internally contradictory: 8 -> 4', () => {
    const conflicts: string[] = [];
    for (const f of DIGITS) for (const t of DIGITS) {
      const r = relationOf(f, t);
      expect(r).not.toBeNull();
      if (r === 'conflicting') conflicts.push(`${f}->${t}`);
    }
    expect(conflicts).toEqual(['8->4']);
    expect(RELATION_TABLE[8].friendly).toContain(4);
    expect(RELATION_TABLE[8].enemy).toContain(4);
  });
  it('the table is not symmetric, so direction matters (1 lists 4 as neutral, 4 lists 1 as friendly)', () => {
    expect(relationOf(1, 4)).toBe('neutral');
    expect(relationOf(4, 1)).toBe('friendly');
  });
  it('fires one rule only when the relations option is on', () => {
    const d = dobOf('23-11-1994'); // Driver 5, Destiny 3 -> row 5 lists 3 as friendly
    expect(ids(buildReport(d, 'dob-only', { asOf: AS_OF })).filter((i) => i.startsWith('REL-'))).toEqual([]);
    expect(ids(buildReport(d, 'dob-only', { extras: ['relations'], asOf: AS_OF })).filter((i) => i.startsWith('REL-'))).toEqual(['REL-FRIENDLY']);
    // 02-06-1970: Driver 2, Destiny 7 -> row 2 lists 7 as neutral
    expect(ids(buildReport(dobOf('02-06-1970'), 'dob-only', { extras: ['relations'], asOf: AS_OF })).filter((i) => i.startsWith('REL-'))).toEqual(['REL-NEUTRAL']);
    // 08-02-2001: digits sum 13 -> Destiny 4, Driver 8 -> conflicting
    expect(ids(buildReport(dobOf('08-02-2001'), 'dob-only', { extras: ['relations'], asOf: AS_OF })).filter((i) => i.startsWith('REL-'))).toEqual(['REL-CONFLICTING']);
  });
  it('relation rules are very low confidence, flagged as disputed, and make no verdict about people', () => {
    for (const r of RULES.filter((x) => x.category === 'relation')) {
      expect(r.confidence).toBe('very-low');
      expect(r.sourceAgreement).toBe('disputed');
      expect(r.exclusions.join(' ')).toMatch(/No compatibility verdict/);
    }
  });
});

describe('gemstones (separate switch)', () => {
  const d = dobOf('23-11-1994'); // Driver 5 -> emerald
  it('appear only when the gemstones option is on, for the Driver number only', () => {
    expect(ids(buildReport(d, 'dob-only', { extras: ['remedies'], asOf: AS_OF })).filter((i) => i.startsWith('GEM-'))).toEqual([]);
    expect(ids(buildReport(d, 'dob-only', { extras: ['gemstones'], asOf: AS_OF })).filter((i) => i.startsWith('GEM-'))).toEqual(['GEM-5']);
  });
  it('are very low confidence with retailer, cost and no-evidence warnings; disputed pairs are flagged', () => {
    const gems = RULES.filter((r) => r.id.startsWith('GEM-'));
    expect(gems).toHaveLength(9);
    for (const g of gems) {
      expect(g.confidence).toBe('very-low');
      expect(g.confidenceReason).toMatch(/retailers.*profit/s);
      expect(g.advancedText).toMatch(/No evidence it has any effect; do not buy a stone because of this/);
      expect(g.exclusions.join(' ')).toMatch(/No purchase, wearing or dosage advice/);
    }
    const by = (n: number) => gems.find((g) => g.id === `GEM-${n}`)!;
    expect(by(6).sourceFidelityStatus).toBe('sources-disagree');
    expect(by(7).sourceFidelityStatus).toBe('sources-disagree');
    expect(by(9).sourceFidelityStatus).toBe('insufficient-documentation');
    expect(by(1).advancedText).toMatch(/ruby/);
  });
});

describe('branding and the shared block model', () => {
  const r = buildReport(dobOf('02-06-1970'), 'dob-only', { asOf: AS_OF, extras: ['relations', 'gemstones', 'cycle'] });
  const base = { name: 'X', extras: ['relations', 'gemstones', 'cycle'] as const, compareText: '', generated: 'g' };
  it('puts branding in the header only when something is entered', () => {
    const none = JSON.stringify(reportBlocks(r, base));
    expect(none).not.toContain('Prepared by');
    const some = reportBlocks(r, { ...base, brand: { business: 'Acme Readings', operator: 'A. Person', contact: 'a@example.test' } });
    expect(some[1]).toEqual({ t: 'p', text: 'Acme Readings · Prepared by A. Person · a@example.test' });
    expect(JSON.stringify(reportBlocks(r, { ...base, brand: { business: '', operator: '', contact: '' } }))).not.toContain('Prepared by');
  });
  it('includes the new optional sections with their riders', () => {
    const text = JSON.stringify(reportBlocks(r, base));
    expect(text).toContain('Driver and Destiny relation (very low confidence)');
    expect(text).toContain('Gemstones reported for the Driver number (very low confidence)');
    expect(text).toContain('Do not buy a stone because of this');
    expect(text).toContain('Personal year cycle (very low confidence)');
    expect(text).toContain('personal month = personal year + calendar month');
    expect(text).toContain('Year grid 2026');
  });
});
