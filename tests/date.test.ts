import { describe, expect, it } from 'vitest';
import { daysInMonth, isLeapYear, isoToDdMmYyyy, parseDob } from '../src/loshu';
import { TODAY } from './helpers';

const ok = (s: string) => parseDob(s, TODAY).ok;

describe('date validation', () => {
  it('accepts valid Gregorian dates and normalises them', () => {
    const r = parseDob('23-11-1994', TODAY);
    expect(r).toMatchObject({ ok: true, dob: { day: 23, month: 11, year: 1994, normalised: '23-11-1994' } });
  });
  it('accepts / and . separators but not mixed ones', () => {
    expect(ok('23/11/1994')).toBe(true);
    expect(ok('23.11.1994')).toBe(true);
    expect(ok('23-11/1994')).toBe(false);
  });
  it('keeps leading zeroes in day and month', () => {
    const r = parseDob('01-02-2003', TODAY);
    expect(r).toMatchObject({ ok: true, dob: { day: 1, month: 2, normalised: '01-02-2003' } });
  });
  it('rejects single-digit day or month rather than guessing', () => {
    expect(ok('1-2-2003')).toBe(false);
    expect(ok('01-2-2003')).toBe(false);
  });
  it('rejects ISO order with a specific explanation', () => {
    const r = parseDob('1994-11-23', TODAY);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/YYYY-MM-DD/);
  });
  it('rejects empty, garbage and two-digit years', () => {
    for (const s of ['', '   ', 'abc', '23-11-94', '23-11-19945', '２３-１１-１９９４']) expect(ok(s)).toBe(false);
  });
  it('handles leap years', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(1900)).toBe(false); // century, not divisible by 400
    expect(isLeapYear(2000)).toBe(true);
    expect(ok('29-02-2024')).toBe(true);
    expect(ok('29-02-2023')).toBe(false);
    expect(ok('29-02-1900')).toBe(false);
    expect(ok('29-02-2000')).toBe(true);
  });
  it('handles month boundaries', () => {
    expect(daysInMonth(2021, 4)).toBe(30);
    expect(ok('30-04-2021')).toBe(true);
    expect(ok('31-04-2021')).toBe(false);
    expect(ok('31-12-1999')).toBe(true);
    expect(ok('01-01-2000')).toBe(true);
    expect(ok('00-01-2000')).toBe(false);
    expect(ok('01-00-2000')).toBe(false);
    expect(ok('01-13-2000')).toBe(false);
    expect(ok('32-01-2000')).toBe(false);
  });
  it('handles century boundaries', () => {
    expect(ok('31-12-1899')).toBe(true);
    expect(ok('01-01-1900')).toBe(true);
    expect(ok('31-12-1999')).toBe(true);
    expect(ok('01-01-2000')).toBe(true);
  });
  it('rejects dates before the Gregorian calendar and in the future', () => {
    expect(ok('14-10-1582')).toBe(false);
    expect(ok('15-10-1582')).toBe(true);
    expect(ok('04-10-2026')).toBe(true); // "today" in the fixture
    expect(ok('05-10-2026')).toBe(false);
  });
  it('converts <input type=date> values', () => {
    expect(isoToDdMmYyyy('1994-11-23')).toBe('23-11-1994');
    expect(isoToDdMmYyyy('')).toBe('');
  });
});
