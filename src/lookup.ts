import { RULES } from './data/catalogue';
import { FREQUENCIES } from './data/frequencies';
import type { InterpretationRule } from './data/schema';
import { getSource } from './data/sources';
import { lineLabel } from './loshu';
import type { Analysis, Digit } from './loshu';

export function ruleById(id: string): InterpretationRule | undefined {
  return RULES.find((r) => r.id === id);
}

/** Rules for a digit, by frequency kind. */
export function digitRule(digit: Digit, kind: 'PRESENT' | 'MISSING' | 'REPEATED-2' | 'REPEATED-3' | 'REPEATED-4PLUS'): InterpretationRule {
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

// ---------- Pattern frequency ("how common is this?") ----------
export interface FrequencyItem {
  key: string;
  label: string;
  percent: number;
}

const pct = (n: number) => Math.round((n / FREQUENCIES.dates) * 10000) / 100;

export const FREQUENCY_RANGE = { from: FREQUENCIES.from, to: FREQUENCIES.to, dates: FREQUENCIES.dates };

/** Share of calendar dates (same overlay mode) that show each pattern present in this analysis. */
export function patternFrequencies(a: Analysis): FrequencyItem[] {
  const t = FREQUENCIES.modes[a.mode.id];
  if (!t) return [];
  const items: FrequencyItem[] = [];
  for (const l of a.lines) {
    if (l.state === 'complete') items.push({ key: `complete-${l.def.id}`, label: `Line ${lineLabel(l.def)} complete`, percent: pct(t.lineComplete[l.def.id] ?? 0) });
    if (l.state === 'empty') items.push({ key: `empty-${l.def.id}`, label: `Line ${lineLabel(l.def)} entirely empty`, percent: pct(t.lineEmpty[l.def.id] ?? 0) });
  }
  for (const d of a.effective.repeated) items.push({ key: `repeated-${d}`, label: `${d} appears twice or more`, percent: pct(t.digitRepeated[d] ?? 0) });
  for (const d of a.effective.missing) items.push({ key: `missing-${d}`, label: `${d} missing`, percent: pct(t.digitMissing[d] ?? 0) });
  const k = a.effective.missing.length;
  items.push({ key: `missing-count-${k}`, label: `Exactly ${k} of the 9 numbers missing`, percent: pct(t.missingCount[k] ?? 0) });
  return items;
}
