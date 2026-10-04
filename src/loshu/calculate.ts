import { DIGITS, LINES, POSITIONS } from './constants';
import { getMode, KUA_UNAVAILABLE_REASON, reduceToDigit } from './overlays';
import type {
  Analysis,
  CalculationAudit,
  DerivedNumber,
  Digit,
  DigitStat,
  LineDef,
  LineState,
  LineStat,
  OverlayModeId,
  ParsedDob,
  VerificationCheck,
} from './types';

export function extractDigits(dob: ParsedDob): number[] {
  const dd = String(dob.day).padStart(2, '0');
  const mm = String(dob.month).padStart(2, '0');
  const yyyy = String(dob.year).padStart(4, '0');
  return (dd + mm + yyyy).split('').map(Number);
}

export function countRaw(nonZero: readonly number[]): Record<Digit, number> {
  const counts = {} as Record<Digit, number>;
  for (const d of DIGITS) counts[d] = 0;
  for (const n of nonZero) counts[n as Digit] += 1;
  return counts;
}

export function statusOf(count: number): 'missing' | 'present' | 'repeated' {
  return count === 0 ? 'missing' : count === 1 ? 'present' : 'repeated';
}

export function lineState(def: LineDef, counts: Record<Digit, number>): LineState {
  const present = def.digits.filter((d) => counts[d] > 0).length;
  return present === 3 ? 'complete' : present === 0 ? 'empty' : 'partial';
}

/** Driver (Moolank): digits of the DAY only, reduced to 1–9. */
export function computeDriver(dob: ParsedDob): DerivedNumber {
  const dayDigits = String(dob.day).padStart(2, '0').split('').map(Number);
  const sum = dayDigits.reduce((a, b) => a + b, 0);
  const { value, steps } = reduceToDigit(sum);
  return {
    name: 'Driver',
    value,
    formula: 'Add the digits of the day of birth; repeat until a single digit 1–9 remains. Month and year are not used.',
    steps: [`${dayDigits.join(' + ')} = ${sum}`, ...steps],
  };
}

/** Destiny (Bhagyank): all digits of the full DD-MM-YYYY date, reduced to 1–9. No master numbers are kept. */
export function computeDestiny(dob: ParsedDob): DerivedNumber {
  const all = extractDigits(dob);
  const sum = all.reduce((a, b) => a + b, 0);
  const { value, steps } = reduceToDigit(sum);
  return {
    name: 'Destiny',
    value,
    formula:
      'Add every digit of DD-MM-YYYY; repeat until a single digit 1–9 remains. Master numbers (11, 22, 33) are not preserved.',
    steps: [`${all.join(' + ')} = ${sum}`, ...steps],
  };
}

export function buildAudit(dob: ParsedDob): CalculationAudit {
  const allDigits = extractDigits(dob);
  const nonZeroDigits = allDigits.filter((d) => d !== 0) as Digit[];
  const rawCounts = countRaw(nonZeroDigits);
  return {
    originalInput: dob.original,
    normalisedDate: dob.normalised,
    allDigits,
    zerosExcluded: allDigits.length - nonZeroDigits.length,
    nonZeroDigits,
    rawCounts,
    presentSet: DIGITS.filter((d) => rawCounts[d] > 0),
    missingSet: DIGITS.filter((d) => rawCounts[d] === 0),
    repeatedSet: DIGITS.filter((d) => rawCounts[d] > 1),
  };
}

/**
 * Single calculation entry point shared by the Basic and Advanced views.
 * The raw DOB audit is never changed by the overlay mode.
 */
export function analyse(dob: ParsedDob, modeId: OverlayModeId = 'dob-only'): Analysis {
  const mode = getMode(modeId);
  if (!mode.available) throw new Error(mode.unavailableReason ?? 'Selected overlay mode is unavailable.');

  const audit = buildAudit(dob);
  const driver = computeDriver(dob);
  const destiny = computeDestiny(dob);

  const overlayCounts = {} as Record<Digit, number>;
  const overlaySources = {} as Record<Digit, Array<'Driver' | 'Destiny'>>;
  for (const d of DIGITS) {
    overlayCounts[d] = 0;
    overlaySources[d] = [];
  }
  if (mode.addsDriver) {
    overlayCounts[driver.value] += 1;
    overlaySources[driver.value].push('Driver');
  }
  if (mode.addsDestiny) {
    overlayCounts[destiny.value] += 1;
    overlaySources[destiny.value].push('Destiny');
  }

  const combined = {} as Record<Digit, number>;
  const digits: DigitStat[] = DIGITS.map((digit) => {
    const raw = audit.rawCounts[digit];
    const overlay = overlayCounts[digit];
    combined[digit] = raw + overlay;
    const rawStatus = statusOf(raw);
    const effectiveStatus = statusOf(raw + overlay);
    return {
      digit,
      position: POSITIONS[digit],
      rawCount: raw,
      overlayCount: overlay,
      combinedCount: raw + overlay,
      rawStatus,
      effectiveStatus,
      overlayChangedStatus: rawStatus !== effectiveStatus,
      overlaySources: overlaySources[digit],
    };
  });

  const lines: LineStat[] = LINES.map((def) => ({
    def,
    positions: def.digits.map((d) => POSITIONS[d]),
    presentDigits: def.digits.filter((d) => combined[d] > 0),
    missingDigits: def.digits.filter((d) => combined[d] === 0),
    state: lineState(def, combined),
    rawState: lineState(def, audit.rawCounts),
  }));

  return {
    dob,
    mode,
    audit,
    driver,
    destiny,
    kua: { available: false, reason: KUA_UNAVAILABLE_REASON },
    digits,
    lines,
    effective: {
      present: DIGITS.filter((d) => combined[d] > 0),
      missing: DIGITS.filter((d) => combined[d] === 0),
      repeated: DIGITS.filter((d) => combined[d] > 1),
    },
    completeLineIds: lines.filter((l) => l.state === 'complete').map((l) => l.def.id),
    emptyLineIds: lines.filter((l) => l.state === 'empty').map((l) => l.def.id),
    partialLineIds: lines.filter((l) => l.state === 'partial').map((l) => l.def.id),
  };
}

/**
 * Runtime self-checks that re-derive results by a different route (string counting,
 * invariants). The UI only claims "Calculation verified" when every check here passes.
 */
export function verifyAnalysis(a: Analysis): VerificationCheck[] {
  const checks: VerificationCheck[] = [];
  const add = (id: string, description: string, passed: boolean) => checks.push({ id, description, passed });

  const compact = a.dob.normalised.replace(/-/g, '');
  add('digits-string', 'Date digits re-extracted from the normalised string match the audit', compact === a.audit.allDigits.join(''));
  add('no-zero', 'No zero digit is in the raw grid', a.audit.nonZeroDigits.every((d) => d >= 1 && d <= 9));
  add(
    'count-total',
    'Sum of raw counts equals the number of non-zero date digits',
    DIGITS.reduce((s, d) => s + a.audit.rawCounts[d], 0) === compact.replace(/0/g, '').length,
  );
  add(
    'count-by-string',
    'Each raw count equals the occurrences of that character in the date string',
    DIGITS.every((d) => a.audit.rawCounts[d] === compact.split(String(d)).length - 1),
  );
  add(
    'missing-zero',
    'Every missing digit has count 0 and every present digit has a positive count',
    DIGITS.every((d) => (a.audit.rawCounts[d] === 0) === a.audit.missingSet.includes(d)),
  );
  add(
    'raw-separate',
    'Overlay counts are stored separately from raw counts',
    a.digits.every((s) => s.combinedCount === s.rawCount + s.overlayCount && s.rawCount === a.audit.rawCounts[s.digit]),
  );
  add('lines-eight', 'Exactly eight geometric lines are evaluated', a.lines.length === 8);
  add(
    'line-sum-15',
    'Every evaluated line sums to 15 (Lo Shu invariant)',
    a.lines.every((l) => l.def.digits.reduce((x, y) => x + y, 0) === 15),
  );
  add(
    'line-states',
    'Complete lines have 3 present digits; empty lines have 3 missing digits',
    a.lines.every(
      (l) =>
        (l.state !== 'complete' || l.presentDigits.length === 3) && (l.state !== 'empty' || l.missingDigits.length === 3),
    ),
  );
  add('driver-range', 'Driver is a single digit 1–9', a.driver.value >= 1 && a.driver.value <= 9);
  add('destiny-range', 'Destiny is a single digit 1–9', a.destiny.value >= 1 && a.destiny.value <= 9);
  return checks;
}
