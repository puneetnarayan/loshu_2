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
 * `unverified-search-summary` is deliberately the weakest honest label: the rule was
 * derived from search-result summaries and the page itself could not be read.
 */
export type SourceFidelity =
  | 'directly-documented'
  | 'multiple-sources'
  | 'school-specific'
  | 'sources-disagree'
  | 'insufficient-documentation'
  | 'unverified-search-summary';

export type SourceAgreement = 'shared' | 'disputed' | 'school-specific' | 'unknown';

export type Category = 'number' | 'repetition' | 'missing-number' | 'line' | 'empty-line' | 'planetary';
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
  /** 1 = primary pattern, 2 = secondary. */
  priority: 1 | 2;
  /** Project-assigned synthesis tags. They are NOT claims made by any source. */
  themes: string[];
  direction: Direction;
  /** `planetary` rules only run when the planetary option is switched on. */
  activation: 'default' | 'planetary';
  /** Short clause used by the deterministic summary template. */
  summaryPhrase: string;
  /** Rules sharing a conclusionKey are treated as duplicates by synthesis. */
  conclusionKey?: string;
}

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
  'unverified-search-summary': {
    short: 'Source not directly verified',
    explanation:
      'The rule reflects what search-result summaries reported about the cited pages. The pages themselves could not be opened, so fidelity to the source text has not been checked.',
  },
};
