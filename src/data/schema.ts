import type { Digit, LineState } from '../loshu/types';

/** Scientific-evidence label (kept separate from calculation and source fidelity). */
export type EvidenceClassification =
  | 'mathematical-fact'
  | 'convention-description'
  | 'traditional-unvalidated'
  | 'empirically-tested'
  | 'insufficient-evidence';

/**
 * How faithfully the rule represents an identified source.
 * No source page could be opened in this project (only search-result summaries), so the
 * strongest label available is `multiple-summaries-agree`: separate searches returned
 * consistent statements. `unverified-search-summary` is weaker: a single summary.
 */
export type SourceFidelity =
  | 'directly-documented'
  | 'multiple-sources'
  | 'school-specific'
  | 'sources-disagree'
  | 'insufficient-documentation'
  | 'multiple-summaries-agree'
  | 'unverified-search-summary';

export type SourceAgreement = 'shared' | 'disputed' | 'school-specific' | 'unknown';

export type Category =
  | 'number'
  | 'repetition'
  | 'missing-number'
  | 'line'
  | 'empty-line'
  | 'partial-line'
  | 'planetary'
  | 'driver'
  | 'destiny'
  | 'planet-profile'
  | 'element'
  | 'remedy'
  | 'cycle'
  | 'name'
  | 'kua'
  | 'relation';

/** Optional readings that can be switched on and off. */
export type Extra = 'planetary' | 'remedies' | 'gemstones' | 'elements' | 'cycle' | 'name' | 'kua' | 'relations';
export const EXTRAS: readonly Extra[] = ['planetary', 'elements', 'kua', 'relations', 'remedies', 'gemstones', 'cycle', 'name'];
/** Extras switched on when the page first opens. Gemstones start off (commercial sources, cost, no evidence). */
export const DEFAULT_EXTRAS: readonly Extra[] = EXTRAS.filter((e) => e !== 'gemstones');

export type Relation = 'friendly' | 'neutral' | 'enemy' | 'conflicting';
export interface RelationCondition {
  from: 'driver' | 'destiny';
  to: 'driver' | 'destiny';
  relation: Relation;
}

export type Element = 'water' | 'earth' | 'wood' | 'metal' | 'fire';
export type DerivedKind = 'driver' | 'destiny' | 'expression' | 'soul-urge' | 'personality' | 'personal-year' | 'kua';

export interface DerivedCondition {
  kind: DerivedKind;
  value: Digit;
}

export interface ElementCondition {
  element: Element;
  /** `absent`: no digit of this element is present. `dominant`: most represented element(s). */
  state: 'absent' | 'dominant';
}

/** How much trust the wording deserves. Traditional readings are never rated "high". */
export type Confidence = 'moderate' | 'low' | 'very-low';
export type Direction = 'strength' | 'emphasis' | 'reflection';

export interface CountCondition {
  digit: Digit;
  min?: number;
  max?: number;
}

export interface LineCondition {
  lineId: string;
  /** `not-complete` matches partial or empty. */
  state: LineState | 'not-complete';
  /** For partial lines: exactly this many of the three digits are present. */
  presentCount?: 1 | 2;
}

export interface SourceRecord {
  id: string;
  title: string;
  /** null when no author could be identified. Never guessed. */
  author: string | null;
  organisation: string | null;
  url: string;
  /** null when no publication date could be identified. */
  publicationDate: string | null;
  lastReviewed: string;
  kind: 'commercial-calculator' | 'blog' | 'academic' | 'reference' | 'skeptical-commentary' | 'user-supplied-unreachable';
  accessMethod: 'search-summary-only' | 'not-accessible' | 'read-in-full';
  tradition: string | null;
  note: string;
}

export interface InterpretationRule {
  id: string;
  title: string;
  category: Category;
  subcategory: string;
  school: string;
  tradition: string;
  sourceIds: string[];
  lastReviewed: string;
  ruleDescription: string;
  /** Human-readable trigger; the matcher uses the structured required* fields. */
  triggerConditions: string;
  requiredDigits: Digit[];
  requiredCounts: CountCondition[];
  requiredLines: LineCondition[];
  requiredDerived?: DerivedCondition[];
  requiredElements?: ElementCondition[];
  requiredRelations?: RelationCondition[];
  calculationMethod: string;
  calculationExplanation: string;
  basicText: string;
  advancedText: string;
  constructiveExpression: string;
  potentialChallenge: string;
  reflectionSuggestion: string;
  evidenceClassification: EvidenceClassification;
  sourceAgreement: SourceAgreement;
  sourceFidelityStatus: SourceFidelity;
  empiricalValidationStatus: string;
  knownDisagreements: string[];
  exclusions: string[];
  limitations: string[];
  version: string;
  // Engine-facing fields (project additions to the specified schema).
  /** 1 = primary pattern, 2 = secondary, 3 = context (key numbers and optional readings). */
  priority: 1 | 2 | 3;
  /** Trust level of the wording, with the reason shown to the reader as a rider. */
  confidence: Confidence;
  confidenceReason: string;
  /** Project-assigned synthesis tags. They are NOT claims made by any source. */
  themes: string[];
  direction: Direction;
  /** Optional readings only run when their option is switched on. */
  activation: 'default' | Extra;
  /** Short clause used by the deterministic summary template. */
  summaryPhrase: string;
  /** Rules sharing a conclusionKey are treated as duplicates by synthesis. */
  conclusionKey?: string;
}

export const CONFIDENCE_LABELS: Record<Confidence, { short: string; rider: string }> = {
  moderate: {
    short: 'Moderate confidence',
    rider: 'Several search summaries agree on the idea, but the pages were not read and the reading is still not scientifically validated.',
  },
  low: {
    short: '⚠ Low confidence',
    rider: 'Low confidence: the wording rests on a single search summary, or on sources that disagree or were not identified. Treat it as an idea to reflect on, not as information about you.',
  },
  'very-low': {
    short: '⚠ Very low confidence',
    rider: 'Very low confidence: forecast-style or convention-dependent reading with no verified source texts and no scientific support. Entertainment and reflection only.',
  },
};

export const EVIDENCE_LABELS: Record<EvidenceClassification, { short: string; explanation: string }> = {
  'mathematical-fact': {
    short: 'Mathematical fact',
    explanation: 'A property that can be verified by arithmetic, such as the grid summing to 15 on every line.',
  },
  'convention-description': {
    short: 'Describes a numerology convention',
    explanation:
      'A statement about how a chosen numerology method works (for example how Driver is calculated). It is accurate as a description of the method, not evidence that the method predicts anything.',
  },
  'traditional-unvalidated': {
    short: 'Traditional interpretation · not scientifically validated',
    explanation:
      'This is what the tradition teaches. No credible controlled study identified in this project shows that it predicts personality or life events.',
  },
  'empirically-tested': {
    short: 'Empirically tested',
    explanation: 'Credible relevant evidence was identified and is cited. Not used for any rule in this version.',
  },
  'insufficient-evidence': {
    short: 'Insufficient evidence to assess',
    explanation: 'No relevant evidence was located, so no claim is made either way.',
  },
};

export const FIDELITY_LABELS: Record<SourceFidelity, { short: string; explanation: string }> = {
  'directly-documented': { short: 'Directly documented', explanation: 'Stated in an identified source that was read in full.' },
  'multiple-sources': { short: 'Several sources agree', explanation: 'Stated by multiple identified sources that were read in full.' },
  'school-specific': { short: 'School-specific', explanation: 'Taught by a particular school; other schools may differ.' },
  'sources-disagree': { short: 'Sources disagree', explanation: 'Identified sources give conflicting names or meanings.' },
  'insufficient-documentation': {
    short: 'Insufficient source documentation',
    explanation: 'No source clearly documents this rule. It is a project convention built on adjacent documented ideas.',
  },
  'multiple-summaries-agree': {
    short: 'Several search summaries agree (pages not read)',
    explanation:
      'Separate searches returned consistent statements of this rule from different sites. The pages themselves could not be opened, so wording has not been compared with the source texts.',
  },
  'unverified-search-summary': {
    short: 'Source not directly verified',
    explanation:
      'The rule reflects what search-result summaries reported about the cited pages. The pages themselves could not be opened, so fidelity to the source text has not been checked.',
  },
};
