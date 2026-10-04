import { reduceToDigit } from './overlays';
import type { ParsedDob } from './types';

export type KuaFormula = 'male' | 'female';
export type KuaGroup = 'east' | 'west';

/** Years for which the two formulas below were checked against published chart values. */
export const KUA_MIN_YEAR = 1900;
export const KUA_MAX_YEAR = 2099;

export const KUA_GROUP_DIRECTIONS: Record<KuaGroup, readonly string[]> = {
  east: ['North', 'South', 'East', 'Southeast'],
  west: ['West', 'Northwest', 'Southwest', 'Northeast'],
};

export function kuaGroup(kua: number): KuaGroup {
  return [1, 3, 4, 9].includes(kua) ? 'east' : 'west';
}

/**
 * Kua for one "solar year" and one of the two traditional formulas.
 * 1900–1999: male = 10 − s, female = s + 5. 2000–2099: male = 9 − s (0 counts as 9), female = s + 6.
 * s = last two digits of the solar year added down to one digit. A result of 5 becomes 2 (male) or 8 (female).
 * Returns null outside 1900–2099, where these constants were not verified.
 */
export function kuaForYear(solarYear: number, formula: KuaFormula): number | null {
  if (!Number.isInteger(solarYear) || solarYear < KUA_MIN_YEAR || solarYear > KUA_MAX_YEAR) return null;
  const lastTwo = solarYear % 100;
  const s = lastTwo === 0 ? 0 : reduceToDigit(lastTwo).value;
  const nineties = solarYear <= 1999;
  let raw: number;
  if (formula === 'male') raw = nineties ? 10 - s : 9 - s;
  else raw = s + (nineties ? 5 : 6);
  let kua = raw === 0 ? 9 : raw > 9 ? reduceToDigit(raw).value : raw;
  if (kua === 5) kua = formula === 'male' ? 2 : 8;
  return kua;
}

export interface KuaCandidate {
  /** Which side of the Li Chun boundary this candidate assumes. */
  assumes: 'before-li-chun' | 'on-or-after-li-chun';
  solarYear: number;
  male: number | null;
  female: number | null;
}

export interface KuaResult {
  /**
   * `before`/`after`: the date is clearly on one side of Li Chun. `uncertain`: 3–5 February, where the exact
   * moment (and time zone) of Li Chun decides, so both candidates are returned.
   */
  boundary: 'before' | 'after' | 'uncertain';
  candidates: KuaCandidate[];
  note: string;
}

/**
 * Li Chun (start of spring, solar longitude 315°) falls on 3, 4 or 5 February. Without an astronomical table the
 * only certain cases are before 3 February (previous solar year) and after 5 February (this year).
 */
export function computeKua(dob: ParsedDob): KuaResult {
  const { year, month, day } = dob;
  const before = month === 1 || (month === 2 && day < 3);
  const uncertain = month === 2 && day >= 3 && day <= 5;
  const cand = (assumes: KuaCandidate['assumes'], solarYear: number): KuaCandidate => ({
    assumes,
    solarYear,
    male: kuaForYear(solarYear, 'male'),
    female: kuaForYear(solarYear, 'female'),
  });
  if (uncertain) {
    return {
      boundary: 'uncertain',
      candidates: [cand('before-li-chun', year - 1), cand('on-or-after-li-chun', year)],
      note: 'Li Chun falls on 3, 4 or 5 February and its exact moment (in China time, UTC+8) decides the solar year. Both results are shown; check the Li Chun time for your year and place of birth.',
    };
  }
  return before
    ? { boundary: 'before', candidates: [cand('before-li-chun', year - 1)], note: 'Born before Li Chun, so the previous solar year is used.' }
    : { boundary: 'after', candidates: [cand('on-or-after-li-chun', year)], note: 'Born after Li Chun, so this year is used.' };
}

/** The single Kua to interpret, or null if the formula, boundary or year range leaves it undetermined. */
export function resolvedKua(k: KuaResult, formula: KuaFormula | 'both'): number | null {
  if (formula === 'both' || k.boundary === 'uncertain' || k.candidates.length !== 1) return null;
  return k.candidates[0]![formula];
}

/** Human-checkable steps for one Kua calculation, or null outside the verified years. */
export function kuaSteps(solarYear: number, formula: KuaFormula): string[] | null {
  const result = kuaForYear(solarYear, formula);
  if (result === null) return null;
  const lastTwo = solarYear % 100;
  const s = lastTwo === 0 ? 0 : reduceToDigit(lastTwo).value;
  const nineties = solarYear <= 1999;
  const raw = formula === 'male' ? (nineties ? 10 - s : 9 - s) : s + (nineties ? 5 : 6);
  const steps = [`Solar year ${solarYear}: last two digits ${String(lastTwo).padStart(2, '0')} → s = ${s}`];
  steps.push(formula === 'male' ? `${nineties ? '10' : '9'} − ${s} = ${raw}` : `${s} + ${nineties ? 5 : 6} = ${raw}`);
  const reduced = raw === 0 ? 9 : raw > 9 ? reduceToDigit(raw).value : raw;
  if (reduced !== raw) steps.push(raw === 0 ? '0 counts as 9' : `${String(raw).split('').join(' + ')} = ${reduced}`);
  if (reduced === 5) steps.push(`5 becomes ${result} (${formula} rule)`);
  return steps;
}
