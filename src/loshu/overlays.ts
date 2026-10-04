import type { Digit, OverlayModeDef, OverlayModeId } from './types';

export const KUA_UNAVAILABLE_REASON =
  'Kua is not implemented. Its result depends on the solar-year boundary (Li Chun, around 3–5 February, which needs an exact time and time zone on those days), the post-1999 birth-year convention and a sex-specific formula. Those conventions could not be verified from primary sources in this project, so Kua is shown as unavailable instead of being guessed.';

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
