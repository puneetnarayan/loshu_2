import { describe, expect, it } from 'vitest';
import { RULES } from '../src/data/catalogue';
import { analyse, buildReport, computeKua, kuaForYear, kuaGroup, kuaSteps, KUA_GROUP_DIRECTIONS, resolvedKua } from '../src/loshu';
import { dobOf } from './helpers';

const AS_OF = new Date(2026, 9, 4);
const ids = (r: ReturnType<typeof buildReport>) => r.triggered.map((t) => t.rule.id).sort();

describe('kuaForYear (hand-derived values; several match published chart values)', () => {
  const cases: Array<[number, number, number]> = [
    // year, male, female
    [1970, 3, 3], // chart value male 3, female 3
    [1984, 7, 8], // chart value male 7, female 8
    [1985, 6, 9], // chart value male 6, female 9
    [2005, 4, 2], // chart value male 4, female 2
    [2004, 2, 1], // male 9-4 = 5 -> 2; female 4+6 = 10 -> 1
    [2018, 9, 6], // s = 9: male 9-9 = 0 counts as 9 (the case that returns 0 in the reviewed app)
    [2009, 9, 6],
    [2000, 9, 6], // s = 0: male 9, female 6
    [1900, 1, 8], // s = 0: male 10 -> 1, female 5 -> 8
    [1999, 1, 8], // s = 9: male 1, female 14 -> 5 -> 8
  ];
  for (const [y, m, f] of cases) {
    it(`${y}: male ${m}, female ${f}`, () => {
      expect(kuaForYear(y, 'male')).toBe(m);
      expect(kuaForYear(y, 'female')).toBe(f);
    });
  }
  it('is unavailable outside 1900-2099, where the constants were not verified', () => {
    for (const y of [1899, 1800, 2100, 2200]) {
      expect(kuaForYear(y, 'male')).toBeNull();
      expect(kuaForYear(y, 'female')).toBeNull();
    }
  });
  it('agrees with an independent closed form for every year 1900-2099 and never returns 0 or 5', () => {
    // s is congruent to (year - 1) mod 9 in the 1900s and (year - 2) mod 9 in the 2000s, which gives for BOTH centuries:
    // male ≡ 2 - year, female ≡ year + 4 (mod 9), with 0 read as 9, before 5 is remapped to 2 (male) or 8 (female).
    const root = (n: number) => ((n % 9) + 9) % 9 || 9;
    for (let y = 1900; y <= 2099; y++) {
      let m = root(2 - y);
      let f = root(y + 4);
      if (m === 5) m = 2;
      if (f === 5) f = 8;
      expect(kuaForYear(y, 'male')).toBe(m);
      expect(kuaForYear(y, 'female')).toBe(f);
      expect([1, 2, 3, 4, 6, 7, 8, 9]).toContain(m);
      expect([1, 2, 3, 4, 6, 7, 8, 9]).toContain(f);
    }
  });
  it('steps are checkable', () => {
    expect(kuaSteps(1970, 'male')).toEqual(['Solar year 1970: last two digits 70 → s = 7', '10 − 7 = 3']);
    expect(kuaSteps(2018, 'male')).toEqual(['Solar year 2018: last two digits 18 → s = 9', '9 − 9 = 0', '0 counts as 9']);
    expect(kuaSteps(2004, 'male')).toContain('5 becomes 2 (male rule)');
    expect(kuaSteps(1899, 'male')).toBeNull();
  });
  it('groups and directions', () => {
    for (const k of [1, 3, 4, 9]) expect(kuaGroup(k)).toBe('east');
    for (const k of [2, 6, 7, 8]) expect(kuaGroup(k)).toBe('west');
    expect(KUA_GROUP_DIRECTIONS.east).toEqual(['North', 'South', 'East', 'Southeast']);
    expect(KUA_GROUP_DIRECTIONS.west).toEqual(['West', 'Northwest', 'Southwest', 'Northeast']);
  });
});

describe('Li Chun boundary (3, 4 or 5 February)', () => {
  it('after the boundary: this year only', () => {
    const k = computeKua(dobOf('15-06-1970'));
    expect(k.boundary).toBe('after');
    expect(k.candidates).toHaveLength(1);
    expect(k.candidates[0]).toMatchObject({ solarYear: 1970, male: 3, female: 3 });
    expect(computeKua(dobOf('06-02-2000')).boundary).toBe('after');
  });
  it('before the boundary: previous solar year (January and 1-2 February)', () => {
    const jan = computeKua(dobOf('20-01-1985'));
    expect(jan.boundary).toBe('before');
    expect(jan.candidates[0]).toMatchObject({ solarYear: 1984, male: 7, female: 8 });
    expect(computeKua(dobOf('02-02-2000')).candidates[0]).toMatchObject({ solarYear: 1999, male: 1, female: 8 });
    expect(computeKua(dobOf('02-02-2021')).boundary).toBe('before');
  });
  it('3, 4 and 5 February are uncertain: both candidates are returned, never a guess', () => {
    for (const d of ['03-02-1990', '04-02-1985', '05-02-2021']) {
      const k = computeKua(dobOf(d));
      expect(k.boundary).toBe('uncertain');
      expect(k.candidates.map((c) => c.assumes)).toEqual(['before-li-chun', 'on-or-after-li-chun']);
      expect(k.candidates[0]!.solarYear).toBe(k.candidates[1]!.solarYear - 1);
    }
    const k = computeKua(dobOf('04-02-1985'));
    expect(k.candidates.map((c) => [c.solarYear, c.male, c.female])).toEqual([[1984, 7, 8], [1985, 6, 9]]);
  });
  it('January 1900 needs the unsupported year 1899', () => {
    const k = computeKua(dobOf('10-01-1900'));
    expect(k.candidates[0]).toMatchObject({ solarYear: 1899, male: null, female: null });
  });
  it('resolvedKua only returns a value when formula and boundary are determined', () => {
    expect(resolvedKua(computeKua(dobOf('15-06-1970')), 'male')).toBe(3);
    expect(resolvedKua(computeKua(dobOf('15-06-1970')), 'both')).toBeNull();
    expect(resolvedKua(computeKua(dobOf('04-02-1985')), 'male')).toBeNull();
    expect(resolvedKua(computeKua(dobOf('10-01-1900')), 'male')).toBeNull();
  });
});

describe('Kua readings in the report', () => {
  const dob = dobOf('15-06-1970');
  it('interprets one Kua only when a formula is chosen and the Kua option is on', () => {
    expect(ids(buildReport(dob, 'dob-only', { extras: ['kua'], kuaFormula: 'male', asOf: AS_OF })).filter((i) => i.startsWith('KUA'))).toEqual(['KUA-3']);
    expect(ids(buildReport(dob, 'dob-only', { extras: ['kua'], kuaFormula: 'both', asOf: AS_OF })).filter((i) => i.startsWith('KUA'))).toEqual([]);
    expect(ids(buildReport(dob, 'dob-only', { kuaFormula: 'male', asOf: AS_OF })).filter((i) => i.startsWith('KUA'))).toEqual([]);
    expect(ids(buildReport(dobOf('04-02-1985'), 'dob-only', { extras: ['kua'], kuaFormula: 'male', asOf: AS_OF })).filter((i) => i.startsWith('KUA'))).toEqual([]);
  });
  it('Kua never changes the grid and has 8 low-confidence rules (no Kua 5)', () => {
    const a = buildReport(dob, 'dob-only', { extras: ['kua'], kuaFormula: 'female' }).analysis;
    expect(a).toEqual(analyse(dob, 'dob-only'));
    const rules = RULES.filter((r) => r.category === 'kua');
    expect(rules.map((r) => r.id)).toEqual(['KUA-1', 'KUA-2', 'KUA-3', 'KUA-4', 'KUA-6', 'KUA-7', 'KUA-8', 'KUA-9']);
    for (const r of rules) {
      expect(r.confidence).toBe('low');
      expect(r.advancedText).toMatch(/different tradition/);
    }
  });
});
