import type { Digit, OverlayModeDef, OverlayModeId } from './types';

export const KUA_UNAVAILABLE_REASON =
  'Kua is calculated and shown in its own section (Feng Shui, a different tradition). It is not added to the date-of-birth grid: no source describing that was verified, and its value depends on the formula chosen and on the 3–5 February Li Chun boundary.';

/** Days on which the Indian pool rule does not add the Driver again (it is already among the date digits). */
export const POOL_DAYS_WITHOUT_DRIVER: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30];

export const OVERLAY_MODES: readonly OverlayModeDef[] = [
  {
    id: 'dob-only',
    label: 'DOB only (default)',
    addsDriver: false,
    addsDestiny: false,
    addsKua: false,
    available: true,
    description:
      'Only the non-zero digits of the full date of birth are counted. Nothing is added. This is the authoritative base calculation.',
  },
  {
    id: 'dob-driver',
    label: 'DOB + Driver',
    addsDriver: true,
    addsDestiny: false,
    addsKua: false,
    available: true,
    description:
      'Adds one extra occurrence of the Driver (Moolank) digit to the overlay layer. Raw date digits are not altered.',
  },
  {
    id: 'dob-destiny',
    label: 'DOB + Destiny',
    addsDriver: false,
    addsDestiny: true,
    addsKua: false,
    available: true,
    description:
      'Adds one extra occurrence of the Destiny (Bhagyank) digit to the overlay layer. Raw date digits are not altered.',
  },
  {
    id: 'dob-driver-destiny',
    label: 'DOB + Driver + Destiny',
    addsDriver: true,
    addsDestiny: true,
    addsKua: false,
    available: true,
    description:
      'Adds one occurrence each of the Driver and Destiny digits to the overlay layer (two additions; they stack if equal).',
  },
  {
    id: 'dob-indian-pool',
    label: 'DOB + Driver/Destiny by the Indian pool rule',
    addsDriver: true,
    addsDestiny: true,
    driverUnlessInDay: true,
    addsKua: false,
    available: true,
    description:
      'Destiny is always added. Driver is added only if the day is not 1–9, 10, 20 or 30 (days on which it is already among the date digits). Low confidence: this rule appears in one search summary and in a reviewed desktop app; many guides add the Driver in every case.',
  },
  {
    id: 'dob-driver-destiny-kua',
    label: 'DOB + Driver + Destiny + Kua (unavailable)',
    addsDriver: true,
    addsDestiny: true,
    addsKua: true,
    available: false,
    unavailableReason: KUA_UNAVAILABLE_REASON,
    description: 'Would also add a Kua number. Unavailable: see the reason shown.',
  },
];

export function getMode(id: OverlayModeId): OverlayModeDef {
  const m = OVERLAY_MODES.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown overlay mode: ${id}`);
  return m;
}

/** Repeated digit-sum until a single digit 1–9. Input must be a positive integer. */
export function reduceToDigit(n: number): { value: Digit; steps: string[] } {
  if (!Number.isInteger(n) || n < 1) throw new Error('reduceToDigit needs a positive integer');
  const steps: string[] = [];
  let cur = n;
  while (cur > 9) {
    const parts = String(cur).split('').map(Number);
    const sum = parts.reduce((a, b) => a + b, 0);
    steps.push(`${parts.join(' + ')} = ${sum}`);
    cur = sum;
  }
  return { value: cur as Digit, steps };
}
