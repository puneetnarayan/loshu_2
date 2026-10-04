import { DIGITS } from './constants';
import { reduceToDigit } from './overlays';
import type { Element } from '../data/schema';
import type { Analysis, Digit, DerivedNumber, ParsedDob } from './types';

// ---------- Five elements of the Luo Shu numbers ----------
export const ELEMENTS: readonly Element[] = ['water', 'wood', 'fire', 'earth', 'metal'];
export const ELEMENT_DIGITS: Record<Element, readonly Digit[]> = {
  water: [1],
  wood: [3, 4],
  fire: [9],
  earth: [2, 5, 8],
  metal: [6, 7],
};

export interface ElementRow {
  element: Element;
  digits: readonly Digit[];
  /** Sum of the counts of this element's digits in the selected mode. */
  count: number;
  presentDigits: Digit[];
}
export interface ElementProfile {
  rows: ElementRow[];
  /** Highest total (ties included); empty if nothing is present. */
  dominant: Element[];
  absent: Element[];
}

export function elementProfile(counts: Record<Digit, number>): ElementProfile {
  const rows = ELEMENTS.map((element): ElementRow => {
    const digits = ELEMENT_DIGITS[element];
    return { element, digits, count: digits.reduce((s, d) => s + counts[d], 0), presentDigits: digits.filter((d) => counts[d] > 0) };
  });
  const max = Math.max(...rows.map((r) => r.count));
  return {
    rows,
    dominant: max > 0 ? rows.filter((r) => r.count === max).map((r) => r.element) : [],
    absent: rows.filter((r) => r.count === 0).map((r) => r.element),
  };
}

// ---------- Planet profile (mapping supplied by the data layer) ----------
export interface PlanetRow {
  digit: Digit;
  planet: string;
  count: number;
  status: 'missing' | 'present' | 'repeated';
}
export function planetProfile(a: Analysis, planetOf: Record<Digit, string>) {
  const rows: PlanetRow[] = a.digits.map((s) => ({ digit: s.digit, planet: planetOf[s.digit], count: s.combinedCount, status: s.effectiveStatus }));
  const max = Math.max(...rows.map((r) => r.count));
  return {
    rows,
    dominant: max > 1 ? rows.filter((r) => r.count === max).map((r) => r.planet) : [],
    absent: rows.filter((r) => r.count === 0).map((r) => r.planet),
  };
}

// ---------- Pythagorean name numbers ----------
const PYTHAGOREAN: Record<string, number> = Object.fromEntries(
  ['AJS', 'BKT', 'CLU', 'DMV', 'ENW', 'FOX', 'GPY', 'HQZ', 'IR'].flatMap((letters, i) => [...letters].map((l) => [l, i + 1])),
);
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']); // Y is treated as a consonant (school-specific)

export interface NameNumber {
  letters: Array<{ letter: string; value: number }>;
  total: number;
  /** Total, then each digit-sum, ending at a single digit. Shows 11/22/33 if the chain passes through them. */
  chain: number[];
  value: Digit;
}
export interface NameNumbers {
  normalised: string;
  expression: NameNumber;
  soulUrge: NameNumber | null;
  personality: NameNumber | null;
  ignored: string[];
}

function nameNumber(letters: string[]): NameNumber | null {
  if (letters.length === 0) return null;
  const rows = letters.map((letter) => ({ letter, value: PYTHAGOREAN[letter]! }));
  const total = rows.reduce((s, r) => s + r.value, 0);
  const chain = [total];
  let cur = total;
  while (cur > 9) {
    cur = [...String(cur)].reduce((s, c) => s + Number(c), 0);
    chain.push(cur);
  }
  return { letters: rows, total, chain, value: cur as Digit };
}

/** Returns null when the text contains no A–Z letters. Accents are stripped; other characters are ignored. */
export function computeNameNumbers(name: string): NameNumbers | null {
  const stripped = name.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
  const letters: string[] = [];
  const ignored: string[] = [];
  for (const ch of stripped) {
    if (/[A-Z]/.test(ch)) letters.push(ch);
    else if (!/[\s.'’-]/.test(ch) && !ignored.includes(ch)) ignored.push(ch);
  }
  const expression = nameNumber(letters);
  if (!expression) return null;
  return {
    normalised: letters.join(''),
    expression,
    soulUrge: nameNumber(letters.filter((l) => VOWELS.has(l))),
    personality: nameNumber(letters.filter((l) => !VOWELS.has(l))),
    ignored,
  };
}

// ---------- Personal year ----------
export interface CycleInfo {
  year: number;
  personalYear: DerivedNumber;
}
/** Birth day + birth month + chosen year, all digits added, reduced to 1–9 (calendar-year convention). */
export function personalYear(dob: ParsedDob, year: number): CycleInfo {
  const digits = [...`${String(dob.day)}${String(dob.month)}${String(year)}`].map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  const { value, steps } = reduceToDigit(sum);
  return {
    year,
    personalYear: {
      name: 'Destiny',
      value,
      formula: 'Add the digits of the birth day, the birth month and the year, then reduce to a single digit 1–9.',
      steps: [`${digits.join(' + ')} = ${sum}`, ...steps],
    },
  };
}

// ---------- Two-date comparison (descriptive arithmetic only) ----------
export interface Comparison {
  both: Digit[];
  onlyA: Digit[];
  onlyB: Digit[];
  neither: Digit[];
  sameDriver: boolean;
  sameDestiny: boolean;
  lines: Array<{ id: string; label: string; a: string; b: string }>;
}
export function compareAnalyses(a: Analysis, b: Analysis): Comparison {
  const has = (x: Analysis, d: Digit) => x.audit.rawCounts[d] > 0;
  return {
    both: DIGITS.filter((d) => has(a, d) && has(b, d)),
    onlyA: DIGITS.filter((d) => has(a, d) && !has(b, d)),
    onlyB: DIGITS.filter((d) => !has(a, d) && has(b, d)),
    neither: DIGITS.filter((d) => !has(a, d) && !has(b, d)),
    sameDriver: a.driver.value === b.driver.value,
    sameDestiny: a.destiny.value === b.destiny.value,
    lines: a.lines.map((l, i) => ({
      id: l.def.id,
      label: l.def.digits.join('–'),
      a: l.rawState,
      b: b.lines[i]!.rawState,
    })),
  };
}
