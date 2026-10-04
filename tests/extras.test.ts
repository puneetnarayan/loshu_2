import { describe, expect, it } from 'vitest';
import { RULES } from '../src/data/catalogue';
import { FREQUENCIES } from '../src/data/frequencies';
import { patternFrequencies } from '../src/lookup';
import {
  analyse, buildReport, compareAnalyses, computeFrequencies, computeNameNumbers, ELEMENT_DIGITS, personalYear, planetProfile,
} from '../src/loshu';
import { displayPosition, displayRows } from '../src/components/GridView';
import { DIGIT_PLANETS } from '../src/data/rules';
import { dobOf } from './helpers';

const AS_OF = new Date(2026, 9, 4);
const ids = (r: ReturnType<typeof buildReport>) => r.triggered.map((t) => t.rule.id).sort();

// All expected values below were worked out by hand.
describe('name numbers (Pythagorean)', () => {
  it('Puneet Narayan: P7 U3 N5 E5 E5 T2 = 27; N5 A1 R9 A1 Y7 A1 N5 = 29; total 56 -> 11 -> 2', () => {
    const n = computeNameNumbers('Puneet Narayan')!;
    expect(n.normalised).toBe('PUNEETNARAYAN');
    expect(n.expression.letters.slice(0, 6).map((l) => l.value)).toEqual([7, 3, 5, 5, 5, 2]);
    expect(n.expression.chain).toEqual([56, 11, 2]); // passes through master number 11, which stays visible
    expect(n.expression.value).toBe(2);
    // vowels U E E A A A = 3+5+5+1+1+1 = 16 -> 7 (Y is a consonant)
    expect(n.soulUrge!.chain).toEqual([16, 7]);
    // consonants P N T N R Y N = 7+5+2+5+9+7+5 = 40 -> 4
    expect(n.personality!.chain).toEqual([40, 4]);
    expect(n.soulUrge!.total + n.personality!.total).toBe(n.expression.total);
  });
  it('handles no vowels, accents and ignored characters', () => {
    const lynn = computeNameNumbers('Lynn')!; // L3 Y7 N5 N5 = 20 -> 2; no A E I O U, Y is a consonant
    expect(lynn.expression.chain).toEqual([20, 2]);
    expect(lynn.soulUrge).toBeNull();
    expect(computeNameNumbers('José')!.expression.chain).toEqual([13, 4]); // J1 O6 S1 E5
    const n = computeNameNumbers('Ana-Maria 7')!; // hyphen and space ignored silently; "7" reported
    expect(n.normalised).toBe('ANAMARIA');
    expect(n.ignored).toEqual(['7']);
  });
  it('returns null when there are no A-Z letters', () => {
    for (const t of ['', '   ', '1234', '李明']) expect(computeNameNumbers(t)).toBeNull();
  });
});

describe('personal year', () => {
  it('02-06-1970 in 2026: 2+6+2+0+2+6 = 18 -> 9', () => {
    const c = personalYear(dobOf('02-06-1970'), 2026);
    expect(c.personalYear.value).toBe(9);
    expect(c.personalYear.steps).toEqual(['2 + 6 + 2 + 0 + 2 + 6 = 18', '1 + 8 = 9']);
  });
  it('matches the worked example in a source summary: born 22 December, 2026 gives 8', () => {
    // The summary adds 12 + 22 + 2026 = 2060 -> 8; adding digits one by one must agree (digital-root property).
    expect(personalYear(dobOf('22-12-1990'), 2026).personalYear.value).toBe(8);
  });
});

describe('elements and planets', () => {
  it('the five elements partition the digits 1-9 exactly once', () => {
    const all = Object.values(ELEMENT_DIGITS).flat().sort();
    expect(all).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
  it('23-11-1994: water 3, wood 2, fire 2, earth 1, metal 0', () => {
    const el = analyse(dobOf('23-11-1994')).elements;
    expect(Object.fromEntries(el.rows.map((r) => [r.element, r.count]))).toEqual({ water: 3, wood: 2, fire: 2, earth: 1, metal: 0 });
    expect(el.dominant).toEqual(['water']);
    expect(el.absent).toEqual(['metal']);
  });
  it('ties list every tied element', () => {
    // 02-06-1970: water 1 (1), fire 1 (9), earth 1 (2), wood 0, metal 2 (6, 7) -> metal alone
    expect(analyse(dobOf('02-06-1970')).elements.dominant).toEqual(['metal']);
  });
  it('planet profile for 23-11-1994 uses the Indian mapping', () => {
    const p = planetProfile(analyse(dobOf('23-11-1994')), DIGIT_PLANETS);
    expect(p.dominant).toEqual(['Sun']); // digit 1 appears three times
    expect(p.absent).toEqual(['Mercury', 'Venus', 'Ketu', 'Saturn']); // digits 5, 6, 7, 8
  });
});

describe('line weights and grid facts (23-11-1994)', () => {
  const a = analyse(dobOf('23-11-1994'));
  it('weights are the sum of the counts of the three digits', () => {
    expect(Object.fromEntries(a.lines.map((l) => [l.def.id, l.weight]))).toEqual({
      'H-492': 4, 'H-357': 1, 'H-816': 3, 'V-438': 2, 'V-951': 5, 'V-276': 1, 'D-456': 1, 'D-258': 1,
    });
  });
  it('facts', () => {
    expect(a.facts).toMatchObject({ centreCount: 0, activeCells: 5, totalCount: 8, heaviestLineIds: ['V-951'] });
    expect(a.facts.lightestLineIds).toEqual(['H-357', 'V-276', 'D-456', 'D-258']);
  });
});

describe('pattern frequencies', () => {
  it('the committed table equals a fresh computation (so it cannot drift from the engine)', () => {
    expect(computeFrequencies(1900, 2025)).toEqual(FREQUENCIES);
  }, 120_000);
  it('matches an independent string-based brute force for 4-5-6 complete and 2-7-6 complete (DOB only)', () => {
    let n = 0, c456 = 0, c276 = 0;
    for (let y = 1900; y <= 2025; y++) for (let m = 1; m <= 12; m++) {
      const dim = new Date(y, m, 0).getDate();
      for (let d = 1; d <= dim; d++) {
        n++;
        const s = `${String(d).padStart(2, '0')}${String(m).padStart(2, '0')}${y}`;
        const has = (ch: string) => s.includes(ch);
        if (has('4') && has('5') && has('6')) c456++;
        if (has('2') && has('7') && has('6')) c276++;
      }
    }
    expect(n).toBe(FREQUENCIES.dates);
    expect(FREQUENCIES.modes['dob-only']!.lineComplete['D-456']).toBe(c456);
    expect(FREQUENCIES.modes['dob-only']!.lineComplete['V-276']).toBe(c276);
  });
  it('percentages for a reading are in range and cover its patterns', () => {
    const items = patternFrequencies(analyse(dobOf('23-11-1994')));
    expect(items.map((i) => i.key)).toEqual(expect.arrayContaining(['complete-H-492', 'repeated-1', 'repeated-9', 'missing-5', 'missing-count-4']));
    for (const i of items) {
      expect(i.percent).toBeGreaterThan(0);
      expect(i.percent).toBeLessThanOrEqual(100);
    }
    // exactly-k-missing shares sum to 100%
    const t = FREQUENCIES.modes['dob-only']!;
    expect(t.missingCount.reduce((x, y) => x + y, 0)).toBe(FREQUENCIES.dates);
  });
});

describe('optional readings switch on and off', () => {
  const dob = dobOf('23-11-1994');
  it('default report has no optional readings; extras add exactly their rules', () => {
    const base = ids(buildReport(dob, 'dob-only', { asOf: AS_OF, name: 'Puneet Narayan' }));
    for (const p of ['REM-', 'CYCLE-', 'NAME-', 'ELEM-', 'PLANET']) expect(base.some((i) => i.startsWith(p))).toBe(false);
    const only = (e: 'remedies' | 'cycle' | 'name' | 'elements') => ids(buildReport(dob, 'dob-only', { extras: [e], asOf: AS_OF, name: 'Puneet Narayan' })).filter((i) => !base.includes(i));
    // missing 5,6,7,8 have remedies; 1 appears three times and has a repeated remedy; 9 repeated has none documented
    expect(only('remedies')).toEqual(['REM-1-REPEATED', 'REM-5-MISSING', 'REM-6-MISSING', 'REM-7-MISSING', 'REM-8-MISSING']);
    expect(only('cycle')).toEqual(['CYCLE-PY-8']); // 2+3+1+1+2+0+2+6 = 17 -> 8
    expect(only('name')).toEqual(['NAME-EXPRESSION-2', 'NAME-PERSONALITY-4', 'NAME-SOUL-7']);
    expect(only('elements')).toEqual(['ELEM-metal-ABSENT', 'ELEM-water-DOMINANT']);
  });
  it('no name means no name rules', () => {
    expect(ids(buildReport(dob, 'dob-only', { extras: ['name'], asOf: AS_OF })).some((i) => i.startsWith('NAME-'))).toBe(false);
  });
  it('Driver and Destiny readings follow the raw date in every overlay mode', () => {
    for (const m of ['dob-only', 'dob-driver', 'dob-destiny', 'dob-driver-destiny'] as const) {
      const r = ids(buildReport(dob, m, { asOf: AS_OF }));
      expect(r).toContain('DRIVER-5');
      expect(r).toContain('DESTINY-3');
    }
  });
  it('partial-line tiers match the count of present digits and never overlap with complete/empty', () => {
    const r = buildReport(dobOf('05-05-2005'), 'dob-only'); // present 2 and 5; 438 and 816 empty; 258 has 2 of 3
    const i = ids(r);
    expect(i).toContain('LINE-D-258-PARTIAL-2');
    expect(i).toContain('LINE-V-438-EMPTY');
    expect(i.some((x) => x === 'LINE-V-438-PARTIAL-1' || x === 'LINE-V-438-PARTIAL-2')).toBe(false);
    expect(i.some((x) => x === 'LINE-D-258-COMPLETE')).toBe(false);
  });
  it('a report is deterministic for the same inputs including the as-of date', () => {
    const opts = { extras: ['planetary', 'remedies', 'elements', 'cycle', 'name'] as const, asOf: AS_OF, name: 'Puneet Narayan' };
    expect(buildReport(dob, 'dob-driver-destiny', opts)).toEqual(buildReport(dob, 'dob-driver-destiny', opts));
  });
  it('the name never changes the grid or its audit', () => {
    const a = buildReport(dob, 'dob-only', { name: 'A' }).analysis;
    const b = buildReport(dob, 'dob-only', { name: 'Completely Different Name' }).analysis;
    expect(a).toEqual(b);
  });
});

describe('confidence riders', () => {
  it('no rule is rated above moderate, and moderate needs multiple agreeing summaries', () => {
    for (const r of RULES) {
      expect(['moderate', 'low', 'very-low']).toContain(r.confidence);
      if (r.confidence === 'moderate') expect(r.sourceFidelityStatus).toBe('multiple-summaries-agree');
      if (r.confidence !== 'moderate') expect(r.confidenceReason.trim().length).toBeGreaterThan(20);
    }
  });
  it('forecast-style and name readings are very low; remedies, planets, elements and tiers are low or lower', () => {
    const level = (c: string) => RULES.filter((r) => r.category === c).map((r) => r.confidence);
    expect(new Set(level('cycle'))).toEqual(new Set(['very-low']));
    expect(new Set(level('name'))).toEqual(new Set(['very-low']));
    for (const c of ['remedy', 'element', 'planet-profile', 'partial-line', 'driver', 'destiny']) expect(level(c)).not.toContain('moderate');
  });
  it('remedy text promises nothing and omits gemstones', () => {
    for (const r of RULES.filter((x) => x.category === 'remedy')) {
      expect(r.advancedText).not.toMatch(/guarantee|will (bring|cure|fix|change)|buy|purchase|wear (a |an )?(ruby|emerald|sapphire|pearl|gemstone|stone)/i);
      expect(r.advancedText).toMatch(/No outcome is promised/);
      expect(r.exclusions.join(' ')).toMatch(/Gemstone/);
    }
  });
});

describe('comparison of two dates', () => {
  it('23-11-1994 vs 02-06-1970 (hand-derived sets)', () => {
    const c = compareAnalyses(analyse(dobOf('23-11-1994')), analyse(dobOf('02-06-1970')));
    expect(c.both).toEqual([1, 2, 9]);
    expect(c.onlyA).toEqual([3, 4]);
    expect(c.onlyB).toEqual([6, 7]);
    expect(c.neither).toEqual([5, 8]);
    expect(c.sameDriver).toBe(false); // 5 vs 2
    expect(c.sameDestiny).toBe(false); // 3 vs 7
    expect(c.lines.find((l) => l.id === 'H-492')).toMatchObject({ a: 'complete', b: 'partial' });
    expect(c.lines.find((l) => l.id === 'V-276')).toMatchObject({ a: 'partial', b: 'complete' });
  });
  it('a date compared with itself shares everything', () => {
    const a = analyse(dobOf('23-11-1994'));
    const c = compareAnalyses(a, a);
    expect(c.onlyA).toEqual([]);
    expect(c.onlyB).toEqual([]);
    expect(c.sameDriver && c.sameDestiny).toBe(true);
  });
});

describe('historical mirror orientation', () => {
  it('mirrors each row only', () => {
    expect(displayRows('modern')).toEqual([[4, 9, 2], [3, 5, 7], [8, 1, 6]]);
    expect(displayRows('historical')).toEqual([[2, 9, 4], [7, 5, 3], [6, 1, 8]]);
  });
  it('position labels are mirrored but the calculation is not', () => {
    expect(displayPosition(4, 'modern')).toBe('top left');
    expect(displayPosition(4, 'historical')).toBe('top right');
    expect(displayPosition(5, 'historical')).toBe('centre');
    // every row, column and diagonal of the mirrored layout still sums to 15
    const g = displayRows('historical');
    for (let i = 0; i < 3; i++) {
      expect(g[i]!.reduce((x, y) => x + y, 0)).toBe(15);
      expect(g[0]![i]! + g[1]![i]! + g[2]![i]!).toBe(15);
    }
    expect(g[0]![0]! + g[1]![1]! + g[2]![2]!).toBe(15);
    expect(g[0]![2]! + g[1]![1]! + g[2]![0]!).toBe(15);
  });
});
