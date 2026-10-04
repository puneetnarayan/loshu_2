import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  analyse, computeDestiny, computeDriver, DIGITS, GRID_LAYOUT, LINES, MAGIC_CONSTANT, OVERLAY_MODES,
  POSITIONS, buildReport, verifyAnalysis, parseDob, reduceToDigit,
} from '../src/loshu';
import type { Digit } from '../src/loshu';
import { dobOf } from './helpers';

// Expected values below were worked out by hand from the date digits, not by running the code.
describe('fixed grid invariants', () => {
  it('uses the exact fixed layout', () => {
    expect(GRID_LAYOUT).toEqual([[4, 9, 2], [3, 5, 7], [8, 1, 6]]);
  });
  it('every row, column and diagonal sums to 15', () => {
    const g = GRID_LAYOUT;
    for (let i = 0; i < 3; i++) {
      expect(g[i]!.reduce((a, b) => a + b, 0)).toBe(MAGIC_CONSTANT);
      expect(g[0]![i]! + g[1]![i]! + g[2]![i]!).toBe(MAGIC_CONSTANT);
    }
    expect(g[0]![0]! + g[1]![1]! + g[2]![2]!).toBe(MAGIC_CONSTANT);
    expect(g[0]![2]! + g[1]![1]! + g[2]![0]!).toBe(MAGIC_CONSTANT);
  });
  it('contains each of 1–9 exactly once', () => {
    expect([...GRID_LAYOUT.flat()].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
  it('maps digits to fixed positions', () => {
    expect(POSITIONS[4]).toMatchObject({ row: 0, col: 0 });
    expect(POSITIONS[5]).toMatchObject({ row: 1, col: 1, label: 'centre' });
    expect(POSITIONS[6]).toMatchObject({ row: 2, col: 2 });
    expect(POSITIONS[2]).toMatchObject({ row: 0, col: 2 });
    expect(POSITIONS[8]).toMatchObject({ row: 2, col: 0 });
  });
  it('defines exactly the eight geometric lines', () => {
    expect(LINES.map((l) => l.digits.join(''))).toEqual(['492', '357', '816', '438', '951', '276', '456', '258']);
    for (const l of LINES) expect(l.digits.reduce((a, b) => a + b, 0)).toBe(15);
  });
});

describe('reduction helper', () => {
  it('reduces by repeated digit sum', () => {
    expect(reduceToDigit(9).value).toBe(9);
    expect(reduceToDigit(10).value).toBe(1);
    expect(reduceToDigit(29).value).toBe(2);
    expect(reduceToDigit(39).value).toBe(3); // 3+9=12 -> 1+2=3
    expect(reduceToDigit(99).steps).toEqual(['9 + 9 = 18', '1 + 8 = 9']);
  });
  it('rejects non-positive input', () => {
    expect(() => reduceToDigit(0)).toThrow();
  });
});

describe('fixture 23-11-1994 (required)', () => {
  const dob = dobOf('23-11-1994');
  const a = analyse(dob);
  it('extracts digits in DDMMYYYY order', () => {
    expect(a.audit.allDigits).toEqual([2, 3, 1, 1, 1, 9, 9, 4]);
    expect(a.audit.zerosExcluded).toBe(0);
  });
  it('has the expected raw counts', () => {
    expect(a.audit.rawCounts).toEqual({ 1: 3, 2: 1, 3: 1, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 2 });
  });
  it('has the expected present, missing and repeated sets', () => {
    expect(a.audit.presentSet).toEqual([1, 2, 3, 4, 9]);
    expect(a.audit.missingSet).toEqual([5, 6, 7, 8]);
    expect(a.audit.repeatedSet).toEqual([1, 9]);
  });
  it('derives Driver 5 and Destiny 3 with checkable steps', () => {
    expect(computeDriver(dob).value).toBe(5);
    expect(computeDriver(dob).steps).toEqual(['2 + 3 = 5']);
    expect(computeDestiny(dob).value).toBe(3);
    expect(computeDestiny(dob).steps).toEqual(['2 + 3 + 1 + 1 + 1 + 9 + 9 + 4 = 30', '3 + 0 = 3']);
  });
  it('evaluates all eight lines by actual membership', () => {
    // present {1,2,3,4,9}: 492 all present; every other line has at least one present digit and one missing.
    const byDigits = Object.fromEntries(a.lines.map((l) => [l.def.digits.join(''), l.state]));
    expect(byDigits).toEqual({
      '492': 'complete', '357': 'partial', '816': 'partial', '438': 'partial',
      '951': 'partial', '276': 'partial', '456': 'partial', '258': 'partial',
    });
    expect(a.completeLineIds).toEqual(['H-492']);
    expect(a.emptyLineIds).toEqual([]);
    expect(a.partialLineIds).toHaveLength(7);
  });
  it('816 is NOT empty because 1 is present', () => {
    const l = a.lines.find((x) => x.def.id === 'H-816')!;
    expect(l.presentDigits).toEqual([1]);
    expect(l.missingDigits).toEqual([8, 6]);
    expect(l.state).toBe('partial');
  });
});

describe('fixture 05-05-2005 (zeros, empty lines, overlays)', () => {
  const dob = dobOf('05-05-2005');
  it('excludes zeros', () => {
    const a = analyse(dob);
    expect(a.audit.allDigits).toEqual([0, 5, 0, 5, 2, 0, 0, 5]);
    expect(a.audit.zerosExcluded).toBe(4);
    expect(a.audit.nonZeroDigits).toEqual([5, 5, 2, 5]);
    expect(a.audit.rawCounts).toEqual({ 1: 0, 2: 1, 3: 0, 4: 0, 5: 3, 6: 0, 7: 0, 8: 0, 9: 0 });
  });
  it('Driver 5 and Destiny 8', () => {
    expect(computeDriver(dob).value).toBe(5);
    expect(computeDestiny(dob).value).toBe(8); // 17 -> 8
  });
  it('raw mode: 816 and 438 are entirely empty; nothing complete', () => {
    const a = analyse(dob);
    expect(a.emptyLineIds.sort()).toEqual(['H-816', 'V-438']);
    expect(a.completeLineIds).toEqual([]);
  });
  it('DOB + Driver adds one 5 only; line states unchanged', () => {
    const a = analyse(dob, 'dob-driver');
    expect(a.digits.find((d) => d.digit === 5)).toMatchObject({ rawCount: 3, overlayCount: 1, combinedCount: 4, overlayChangedStatus: false });
    expect(a.emptyLineIds.sort()).toEqual(['H-816', 'V-438']);
  });
  it('DOB + Destiny adds one 8: changes status, completes 258, ends two empty lines', () => {
    const a = analyse(dob, 'dob-destiny');
    expect(a.digits.find((d) => d.digit === 8)).toMatchObject({ rawCount: 0, overlayCount: 1, combinedCount: 1, rawStatus: 'missing', effectiveStatus: 'present', overlayChangedStatus: true });
    expect(a.completeLineIds).toEqual(['D-258']);
    expect(a.emptyLineIds).toEqual([]);
    expect(a.lines.find((l) => l.def.id === 'D-258')!.rawState).toBe('partial');
  });
  it('DOB + Driver + Destiny adds both', () => {
    const a = analyse(dob, 'dob-driver-destiny');
    expect(a.digits.find((d) => d.digit === 5)!.combinedCount).toBe(4);
    expect(a.digits.find((d) => d.digit === 8)!.combinedCount).toBe(1);
    expect(a.effective.missing).toEqual([1, 3, 4, 6, 7, 9]);
  });
  it('stacks when Driver equals Destiny', () => {
    // 06-06-2001: Driver 6; Destiny 0+6+0+6+2+0+0+1 = 15 -> 6. Equal, so both overlays land on 6.
    const a = analyse(dobOf('06-06-2001'), 'dob-driver-destiny');
    expect(computeDriver(dobOf('06-06-2001')).value).toBe(6);
    expect(computeDestiny(dobOf('06-06-2001')).value).toBe(6);
    expect(a.digits.find((d) => d.digit === 6)).toMatchObject({ rawCount: 2, overlayCount: 2, combinedCount: 4, overlaySources: ['Driver', 'Destiny'] });
  });
});

describe('other fixtures', () => {
  it('01-01-2001: leading zeros, 1×3 and 2×1; Driver 1; Destiny 5', () => {
    const d = dobOf('01-01-2001');
    const a = analyse(d);
    expect(a.audit.rawCounts).toEqual({ 1: 3, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 });
    expect(a.audit.zerosExcluded).toBe(4);
    expect(computeDriver(d).value).toBe(1);
    expect(computeDestiny(d).value).toBe(5);
  });
  it('29-02-2000 (leap): 2×3, 9×1; Driver 11 -> 2; Destiny 15 -> 6', () => {
    const d = dobOf('29-02-2000');
    expect(analyse(d).audit.rawCounts).toEqual({ 1: 0, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 1 });
    expect(computeDriver(d).value).toBe(2);
    expect(computeDriver(d).steps).toEqual(['2 + 9 = 11', '1 + 1 = 2']);
    expect(computeDestiny(d).value).toBe(6);
  });
  it('31-12-1999: 1×3 2×1 3×1 9×3; Driver 4; Destiny 35 -> 8', () => {
    const d = dobOf('31-12-1999');
    expect(analyse(d).audit.rawCounts).toEqual({ 1: 3, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 3 });
    expect(computeDriver(d).value).toBe(4);
    expect(computeDestiny(d).value).toBe(8);
  });
  it('09-09-1999: Driver 9 needs no further reduction', () => {
    expect(computeDriver(dobOf('09-09-1999'))).toMatchObject({ value: 9, steps: ['0 + 9 = 9'] });
  });
});

describe('default fixture 02-06-1970', () => {
  const d = dobOf('02-06-1970');
  const a = analyse(d);
  it('digits 0,2,0,6,1,9,7,0: three zeros excluded, five digits once each', () => {
    expect(a.audit.allDigits).toEqual([0, 2, 0, 6, 1, 9, 7, 0]);
    expect(a.audit.zerosExcluded).toBe(3);
    expect(a.audit.rawCounts).toEqual({ 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 0, 9: 1 });
    expect(a.audit.repeatedSet).toEqual([]);
  });
  it('Driver 2 and Destiny 25 -> 7', () => {
    expect(computeDriver(d)).toMatchObject({ value: 2, steps: ['0 + 2 = 2'] });
    expect(computeDestiny(d)).toMatchObject({ value: 7, steps: ['0 + 2 + 0 + 6 + 1 + 9 + 7 + 0 = 25', '2 + 5 = 7'] });
  });
  it('2-7-6 is complete, 4-3-8 entirely empty, the other six partial', () => {
    expect(a.completeLineIds).toEqual(['V-276']);
    expect(a.emptyLineIds).toEqual(['V-438']);
    expect(a.partialLineIds.sort()).toEqual(['D-258', 'D-456', 'H-357', 'H-492', 'H-816', 'V-951']);
  });
});

describe('overlay modes', () => {
  it('lists six modes; adding Kua to the grid is unavailable and cannot be analysed', () => {
    expect(OVERLAY_MODES.map((m) => m.id)).toEqual(['dob-only', 'dob-driver', 'dob-destiny', 'dob-driver-destiny', 'dob-indian-pool', 'dob-driver-destiny-kua']);
    const kua = OVERLAY_MODES[5]!;
    expect(kua.available).toBe(false);
    expect(() => analyse(dobOf('23-11-1994'), kua.id)).toThrow(/not added to the date-of-birth grid/);
  });
  it('DOB-only adds nothing', () => {
    const a = analyse(dobOf('23-11-1994'));
    expect(a.digits.every((d) => d.overlayCount === 0)).toBe(true);
  });
  it('23-11-1994 + Driver + Destiny: 5 and 3 gain one each, raw audit unchanged', () => {
    const d = dobOf('23-11-1994');
    const raw = analyse(d);
    const a = analyse(d, 'dob-driver-destiny');
    expect(a.digits.find((x) => x.digit === 5)).toMatchObject({ rawCount: 0, overlayCount: 1, effectiveStatus: 'present', overlayChangedStatus: true });
    expect(a.digits.find((x) => x.digit === 3)).toMatchObject({ rawCount: 1, overlayCount: 1, combinedCount: 2, effectiveStatus: 'repeated', overlayChangedStatus: true });
    expect(a.audit).toEqual(raw.audit);
  });
});

describe('Indian pool rule (Destiny always; Driver unless the day is 1-9, 10, 20 or 30)', () => {
  it('02-06-1970: day 2, Driver is NOT added; Destiny 7 is added (7 appears twice)', () => {
    const a = analyse(dobOf('02-06-1970'), 'dob-indian-pool');
    expect(a.digits.find((d) => d.digit === 2)).toMatchObject({ rawCount: 1, overlayCount: 0, combinedCount: 1 });
    expect(a.digits.find((d) => d.digit === 7)).toMatchObject({ rawCount: 1, overlayCount: 1, combinedCount: 2, overlaySources: ['Destiny'] });
  });
  it('23-11-1994: day 23, both added (same as Driver + Destiny)', () => {
    const d = dobOf('23-11-1994');
    expect(analyse(d, 'dob-indian-pool').digits).toEqual(analyse(d, 'dob-driver-destiny').digits);
  });
  it('10-10-2010: day 10, Driver 1 not added; Destiny 5 added', () => {
    const a = analyse(dobOf('10-10-2010'), 'dob-indian-pool'); // digits 1,0,1,0,2,0,1,0 -> 1x3, 2x1; Destiny 5
    expect(a.digits.find((d) => d.digit === 1)).toMatchObject({ rawCount: 3, overlayCount: 0 });
    expect(a.digits.find((d) => d.digit === 5)).toMatchObject({ rawCount: 0, overlayCount: 1 });
  });
  it('days 11-19, 21-29 and 31 add the Driver (19: Driver 1, 29: Driver 2, 31: Driver 4)', () => {
    expect(analyse(dobOf('19-03-1990'), 'dob-indian-pool').digits.find((d) => d.digit === 1)!.overlaySources).toContain('Driver');
    expect(analyse(dobOf('29-03-1990'), 'dob-indian-pool').digits.find((d) => d.digit === 2)!.overlaySources).toContain('Driver');
    expect(analyse(dobOf('31-01-1987'), 'dob-indian-pool').digits.find((d) => d.digit === 4)!.overlaySources).toContain('Driver');
  });
  it('the raw audit is untouched and the mode is deterministic', () => {
    const d = dobOf('15-03-1977');
    expect(analyse(d, 'dob-indian-pool').audit).toEqual(analyse(d, 'dob-only').audit);
    expect(analyse(d, 'dob-indian-pool')).toEqual(analyse(d, 'dob-indian-pool'));
  });
});

describe('property checks', () => {
  const dateArb = fc.date({ min: new Date('1583-01-01T12:00:00Z'), max: new Date('2100-12-31T12:00:00Z'), noInvalidDate: true });
  const toText = (d: Date) =>
    `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCFullYear()).padStart(4, '0')}`;
  const modes = ['dob-only', 'dob-driver', 'dob-destiny', 'dob-driver-destiny', 'dob-indian-pool'] as const;
  const parse = (d: Date) => {
    const r = parseDob(toText(d), new Date(2200, 0, 1));
    if (!r.ok) throw new Error(r.error);
    return r.dob;
  };

  it('counts each digit exactly as often as it appears; no zero; totals match', () => {
    fc.assert(
      fc.property(dateArb, (d) => {
        const text = toText(d);
        const a = analyse(parse(d));
        for (const digit of DIGITS) expect(a.audit.rawCounts[digit]).toBe(text.split(String(digit)).length - 1);
        expect(a.audit.nonZeroDigits.includes(0 as Digit)).toBe(false);
        const total = DIGITS.reduce((s, x) => s + a.audit.rawCounts[x], 0);
        expect(total).toBe(text.replace(/[-0]/g, '').length);
      }),
    );
  });
  it('missing digits have count 0, present digits positive, repeated digits > 1', () => {
    fc.assert(
      fc.property(dateArb, fc.constantFrom(...modes), (d, mode) => {
        const a = analyse(parse(d), mode);
        for (const s of a.digits) {
          expect(s.rawStatus === 'missing').toBe(s.rawCount === 0);
          expect(a.effective.missing.includes(s.digit)).toBe(s.combinedCount === 0);
          expect(a.effective.repeated.includes(s.digit)).toBe(s.combinedCount > 1);
        }
      }),
    );
  });
  it('complete lines have 3 present digits, empty lines 3 missing; all lines come from the eight', () => {
    const ids = new Set(LINES.map((l) => l.id));
    fc.assert(
      fc.property(dateArb, fc.constantFrom(...modes), (d, mode) => {
        const a = analyse(parse(d), mode);
        for (const l of a.lines) {
          expect(ids.has(l.def.id)).toBe(true);
          if (l.state === 'complete') expect(l.presentDigits).toHaveLength(3);
          if (l.state === 'empty') expect(l.missingDigits).toHaveLength(3);
        }
        for (const id of [...a.completeLineIds, ...a.emptyLineIds, ...a.partialLineIds]) expect(ids.has(id)).toBe(true);
        expect(a.completeLineIds.length + a.emptyLineIds.length + a.partialLineIds.length).toBe(8);
      }),
    );
  });
  it('is deterministic and overlays never mutate the raw layer', () => {
    fc.assert(
      fc.property(dateArb, fc.constantFrom(...modes), (d, mode) => {
        const dob = parse(d);
        const first = analyse(dob, mode);
        expect(analyse(dob, mode)).toEqual(first);
        expect(first.audit).toEqual(analyse(dob, 'dob-only').audit);
        for (const s of first.digits) expect(s.combinedCount).toBe(s.rawCount + s.overlayCount);
        const skipsDriver = mode === 'dob-indian-pool' && (dob.day <= 10 || dob.day === 20 || dob.day === 30);
        expect(first.digits.reduce((n, s) => n + s.overlayCount, 0)).toBe((first.mode.addsDriver && !skipsDriver ? 1 : 0) + (first.mode.addsDestiny ? 1 : 0));
      }),
    );
  });
  it('Driver and Destiny are single digits and match an independent string-based computation', () => {
    const reduce = (s: string): number => {
      let n = [...s].reduce((a, c) => a + Number(c), 0);
      while (n > 9) n = [...String(n)].reduce((a, c) => a + Number(c), 0);
      return n;
    };
    fc.assert(
      fc.property(dateArb, (d) => {
        const text = toText(d);
        const dob = parse(d);
        expect(computeDriver(dob).value).toBe(reduce(text.slice(0, 2)));
        expect(computeDestiny(dob).value).toBe(reduce(text.replace(/-/g, '')));
      }),
    );
  });
  it('all runtime verification checks pass for every mode', () => {
    fc.assert(
      fc.property(dateArb, fc.constantFrom(...modes), (d, mode) => {
        const checks = verifyAnalysis(analyse(parse(d), mode));
        expect(checks.length).toBeGreaterThan(5);
        expect(checks.filter((c) => !c.passed)).toEqual([]);
      }),
    );
  });
  it('Basic and Advanced (DOB-only) report identical underlying calculations', () => {
    fc.assert(
      fc.property(dateArb, (d) => {
        const dob = parse(d);
        const basic = buildReport(dob, 'dob-only');
        const advanced = buildReport(dob, 'dob-only', { planetary: true });
        expect(advanced.analysis).toEqual(basic.analysis);
        expect(advanced.checks).toEqual(basic.checks);
      }),
    );
  });
});
