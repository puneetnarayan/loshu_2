import { DIGITS, LINES } from '../loshu/constants';
import type { InterpretationRule, SourceRecord } from './schema';

const REQUIRED_STRING_FIELDS: Array<keyof InterpretationRule> = [
  'id', 'title', 'category', 'subcategory', 'school', 'tradition', 'lastReviewed', 'ruleDescription',
  'triggerConditions', 'calculationMethod', 'calculationExplanation', 'basicText', 'advancedText',
  'constructiveExpression', 'potentialChallenge', 'reflectionSuggestion', 'evidenceClassification',
  'sourceAgreement', 'sourceFidelityStatus', 'empiricalValidationStatus', 'version', 'summaryPhrase',
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns a list of human-readable problems. An empty list means the catalogue is valid. */
export function validateCatalogue(rules: readonly InterpretationRule[], sources: readonly SourceRecord[]): string[] {
  const errors: string[] = [];
  const sourceIds = new Set<string>();
  for (const s of sources) {
    if (sourceIds.has(s.id)) errors.push(`Duplicate source id ${s.id}`);
    sourceIds.add(s.id);
    if (!/^https:\/\//.test(s.url)) errors.push(`Source ${s.id}: url must be https`);
    if (!ISO_DATE.test(s.lastReviewed)) errors.push(`Source ${s.id}: lastReviewed must be YYYY-MM-DD`);
    if (s.publicationDate !== null && !ISO_DATE.test(s.publicationDate)) errors.push(`Source ${s.id}: bad publicationDate`);
    if (!s.title.trim()) errors.push(`Source ${s.id}: empty title`);
  }

  const ruleIds = new Set<string>();
  const lineIds = new Set(LINES.map((l) => l.id));
  for (const r of rules) {
    if (ruleIds.has(r.id)) errors.push(`Duplicate rule id ${r.id}`);
    ruleIds.add(r.id);
    for (const f of REQUIRED_STRING_FIELDS) {
      const v = r[f];
      if (typeof v !== 'string' || v.trim() === '') errors.push(`${r.id}: field ${String(f)} is empty`);
    }
    if (!ISO_DATE.test(r.lastReviewed)) errors.push(`${r.id}: lastReviewed must be YYYY-MM-DD`);
    if (r.sourceIds.length === 0) errors.push(`${r.id}: needs at least one sourceId`);
    for (const sid of r.sourceIds) if (!sourceIds.has(sid)) errors.push(`${r.id}: unknown sourceId ${sid}`);
    for (const d of r.requiredDigits) if (!DIGITS.includes(d)) errors.push(`${r.id}: bad requiredDigit ${d}`);
    for (const c of r.requiredCounts) {
      if (!DIGITS.includes(c.digit)) errors.push(`${r.id}: bad count digit ${c.digit}`);
      if (c.min === undefined && c.max === undefined) errors.push(`${r.id}: count condition has no bounds`);
      if (c.min !== undefined && c.max !== undefined && c.min > c.max) errors.push(`${r.id}: count min > max`);
    }
    for (const l of r.requiredLines) if (!lineIds.has(l.lineId)) errors.push(`${r.id}: unknown line ${l.lineId}`);
    if (r.requiredDigits.length + r.requiredCounts.length + r.requiredLines.length === 0) {
      errors.push(`${r.id}: has no structured trigger condition`);
    }
    if (!Array.isArray(r.knownDisagreements) || !Array.isArray(r.exclusions) || !Array.isArray(r.limitations)) {
      errors.push(`${r.id}: knownDisagreements/exclusions/limitations must be arrays`);
    }
    if (r.sourceAgreement === 'disputed' && r.knownDisagreements.length === 0) {
      errors.push(`${r.id}: disputed rule must document its disagreements`);
    }
    if (r.sourceFidelityStatus === 'sources-disagree' && r.knownDisagreements.length === 0) {
      errors.push(`${r.id}: sources-disagree needs knownDisagreements`);
    }
    // Honesty guards: a rule may only claim strong source fidelity or empirical status if its sources were read.
    const strong = r.sourceFidelityStatus === 'directly-documented' || r.sourceFidelityStatus === 'multiple-sources';
    if (strong) {
      const allRead = r.sourceIds.every((sid) => sources.find((s) => s.id === sid)?.accessMethod === 'read-in-full');
      if (!allRead) errors.push(`${r.id}: claims ${r.sourceFidelityStatus} but cites a source that was not read in full`);
    }
    if (r.evidenceClassification === 'empirically-tested') {
      const hasRead = r.sourceIds.some((sid) => {
        const s = sources.find((x) => x.id === sid);
        return s?.kind === 'academic' && s.accessMethod === 'read-in-full';
      });
      if (!hasRead) errors.push(`${r.id}: empirically-tested requires an academic source read in full`);
    }
  }
  return errors;
}
