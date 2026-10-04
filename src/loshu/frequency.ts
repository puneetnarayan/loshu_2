import { analyse } from './calculate';
import { DIGITS, LINES } from './constants';
import type { Digit, OverlayModeId } from './types';

export const FREQUENCY_MODES: readonly OverlayModeId[] = ['dob-only', 'dob-driver', 'dob-destiny', 'dob-driver-destiny', 'dob-indian-pool'];

export interface ModeFrequency {
  lineComplete: Record<string, number>;
  lineEmpty: Record<string, number>;
  digitMissing: Record<number, number>;
  digitRepeated: Record<number, number>;
  /** missingCount[k] = number of dates with exactly k missing digits (k = 0..9). */
  missingCount: number[];
}

export interface FrequencyTable {
  from: string;
  to: string;
  dates: number;
  modes: Record<string, ModeFrequency>;
}

/** Counts patterns over every calendar date in [fromYear, toYear], each date weighted equally. */
export function computeFrequencies(fromYear: number, toYear: number): FrequencyTable {
  const modes: Record<string, ModeFrequency> = {};
  for (const m of FREQUENCY_MODES) {
    modes[m] = {
      lineComplete: Object.fromEntries(LINES.map((l) => [l.id, 0])),
      lineEmpty: Object.fromEntries(LINES.map((l) => [l.id, 0])),
      digitMissing: Object.fromEntries(DIGITS.map((d) => [d, 0])),
      digitRepeated: Object.fromEntries(DIGITS.map((d) => [d, 0])),
      missingCount: Array.from({ length: 10 }, () => 0),
    };
  }
  let dates = 0;
  for (let year = fromYear; year <= toYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const dim = new Date(year, month, 0).getDate();
      for (let day = 1; day <= dim; day++) {
        dates++;
        const dob = { original: '', day, month, year, normalised: '' };
        for (const m of FREQUENCY_MODES) {
          const a = analyse(dob, m);
          const t = modes[m]!;
          for (const id of a.completeLineIds) t.lineComplete[id]!++;
          for (const id of a.emptyLineIds) t.lineEmpty[id]!++;
          for (const d of a.effective.missing) t.digitMissing[d as Digit]!++;
          for (const d of a.effective.repeated) t.digitRepeated[d as Digit]!++;
          t.missingCount[a.effective.missing.length]!++;
        }
      }
    }
  }
  return { from: `${fromYear}-01-01`, to: `${toYear}-12-31`, dates, modes };
}
