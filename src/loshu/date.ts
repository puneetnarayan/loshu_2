import type { DobParseResult } from './types';

export const MIN_DATE = { year: 1582, month: 10, day: 15 }; // first day of the Gregorian calendar

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

const STRICT = /^([0-9]{2})([-/.])([0-9]{2})\2([0-9]{4})$/;

/**
 * Strict DD-MM-YYYY parser. Accepts "-", "/" or "." as a (consistent) separator.
 * It never guesses: single-digit day/month, two-digit years and ISO order are rejected
 * with an explanation rather than reinterpreted.
 * `today` is injectable so the future-date check is deterministic in tests.
 */
export function parseDob(input: string, today: Date = new Date()): DobParseResult {
  const original = input;
  const text = input.trim();
  if (text === '') return { ok: false, error: 'Enter a date of birth in DD-MM-YYYY format.' };
  if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(text)) {
    return { ok: false, error: 'This looks like YYYY-MM-DD. Please enter the date as DD-MM-YYYY (day first).' };
  }
  const m = STRICT.exec(text);
  if (!m) {
    return {
      ok: false,
      error: 'Use exactly DD-MM-YYYY with a two-digit day, two-digit month and four-digit year (for example 23-11-1994).',
    };
  }
  const day = Number(m[1]);
  const month = Number(m[3]);
  const year = Number(m[4]);
  if (month < 1 || month > 12) return { ok: false, error: `Month ${m[3]} is not valid. Months run from 01 to 12.` };
  if (day < 1 || day > daysInMonth(year, month)) {
    return {
      ok: false,
      error: `Day ${m[1]} does not exist in month ${m[3]} of ${year} (that month has ${daysInMonth(year, month)} days).`,
    };
  }
  const { year: minY, month: minM, day: minD } = MIN_DATE;
  if (year * 10000 + month * 100 + day < minY * 10000 + minM * 100 + minD) {
    return { ok: false, error: 'Dates before 15-10-1582 (the start of the Gregorian calendar) are not supported.' };
  }
  const todayKey = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  if (year * 10000 + month * 100 + day > todayKey) {
    return { ok: false, error: 'A date of birth cannot be in the future.' };
  }
  const normalised = `${m[1]}-${m[3]}-${m[4]}`;
  return { ok: true, dob: { original, day, month, year, normalised } };
}

/** Convert the value of <input type="date"> (YYYY-MM-DD) to DD-MM-YYYY text. */
export function isoToDdMmYyyy(iso: string): string {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}
