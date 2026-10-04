import type { ElementProfile } from './extras';

export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type LineKind = 'horizontal' | 'vertical' | 'diagonal';
export type LineState = 'complete' | 'partial' | 'empty';

/** Row/column are 0-based, top-left origin. */
export interface CellPosition {
  row: number;
  col: number;
  label: string;
}

export interface LineDef {
  id: string;
  kind: LineKind;
  digits: readonly [Digit, Digit, Digit];
}

export interface ParsedDob {
  original: string;
  day: number;
  month: number;
  year: number;
  /** DD-MM-YYYY */
  normalised: string;
}

export type DobParseResult =
  | { ok: true; dob: ParsedDob }
  | { ok: false; error: string };

export type OverlayModeId =
  | 'dob-only'
  | 'dob-driver'
  | 'dob-destiny'
  | 'dob-driver-destiny'
  | 'dob-driver-destiny-kua';

export interface OverlayModeDef {
  id: OverlayModeId;
  label: string;
  addsDriver: boolean;
  addsDestiny: boolean;
  addsKua: boolean;
  available: boolean;
  unavailableReason?: string;
  description: string;
}

export interface DerivedNumber {
  name: 'Driver' | 'Destiny';
  value: Digit;
  /** Human-checkable steps, e.g. "2 + 3 = 5". */
  steps: string[];
  formula: string;
}

export interface DigitStat {
  digit: Digit;
  position: CellPosition;
  rawCount: number;
  overlayCount: number;
  combinedCount: number;
  /** Status in the raw DOB layer. */
  rawStatus: 'missing' | 'present' | 'repeated';
  /** Status in the selected mode (raw + overlay). */
  effectiveStatus: 'missing' | 'present' | 'repeated';
  overlayChangedStatus: boolean;
  overlaySources: Array<'Driver' | 'Destiny'>;
}

export interface LineStat {
  def: LineDef;
  positions: CellPosition[];
  presentDigits: Digit[];
  missingDigits: Digit[];
  state: LineState;
  /** Same measures on the raw DOB layer, independent of overlays. */
  rawState: LineState;
  /** Sum of the combined counts of the three digits (how heavily the line is populated). */
  weight: number;
}

export interface GridFacts {
  centreCount: number;
  activeCells: number;
  totalCount: number;
  heaviestLineIds: string[];
  lightestLineIds: string[];
}

export interface CalculationAudit {
  originalInput: string;
  normalisedDate: string;
  /** Every character-derived digit of DDMMYYYY, in order, zero included. */
  allDigits: number[];
  zerosExcluded: number;
  nonZeroDigits: Digit[];
  rawCounts: Record<Digit, number>;
  presentSet: Digit[];
  missingSet: Digit[];
  repeatedSet: Digit[];
}

export interface Analysis {
  dob: ParsedDob;
  mode: OverlayModeDef;
  audit: CalculationAudit;
  driver: DerivedNumber;
  destiny: DerivedNumber;
  kua: { available: false; reason: string };
  digits: DigitStat[];
  lines: LineStat[];
  /** Sets for the selected mode (raw + overlay). */
  effective: { present: Digit[]; missing: Digit[]; repeated: Digit[] };
  completeLineIds: string[];
  emptyLineIds: string[];
  partialLineIds: string[];
  facts: GridFacts;
  elements: ElementProfile;
}

export interface VerificationCheck {
  id: string;
  description: string;
  passed: boolean;
}
