import { RULES } from './data/rules';
import type { InterpretationRule } from './data/schema';
import { getSource } from './data/sources';
import type { Digit } from './loshu';

export function ruleById(id: string): InterpretationRule | undefined {
  return RULES.find((r) => r.id === id);
}

/** Rules for a digit, by frequency kind. */
export function digitRule(digit: Digit, kind: 'PRESENT' | 'MISSING' | 'REPEATED'): InterpretationRule {
  const r = ruleById(`NUM-${digit}-${kind}`);
  if (!r) throw new Error(`Missing catalogue rule NUM-${digit}-${kind}`);
  return r;
}

/** Resolves the source fields the rule schema lists (sourceTitle, sourceAuthor, sourceUrl, sourceDate). */
export function resolveSources(rule: InterpretationRule) {
  return rule.sourceIds.flatMap((id) => {
    const s = getSource(id);
    return s
      ? [{ id, sourceTitle: s.title, sourceAuthor: s.author, sourceUrl: s.url, sourceDate: s.publicationDate, access: s.accessMethod }]
      : [];
  });
}
