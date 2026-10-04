import type { InterpretationRule } from '../data/schema';
import type { TriggeredRule } from './engine';
import type { Analysis } from './types';

export interface Group {
  theme: string;
  ruleIds: string[];
  explanation: string;
}

export interface Unsupported {
  subject: string;
  reason: string;
}

export interface AuditEntry {
  ruleId: string;
  tier: 'primary' | 'secondary' | 'context' | 'merged-duplicate';
  included: boolean;
  why: string[];
  note: string;
}

export interface Synthesis {
  primary: TriggeredRule[];
  secondary: TriggeredRule[];
  /** Key numbers and optional readings (Driver/Destiny, planets, elements, remedies, cycle, name). */
  context: TriggeredRule[];
  duplicatesRemoved: Array<{ removed: string; keptAs: string }>;
  reinforcing: Group[];
  conflicts: Group[];
  unsupported: Unsupported[];
  /** Deterministic summary sentences. */
  summary: string[];
  audit: AuditEntry[];
}

function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join('; ')}; and ${items[items.length - 1]}`;
}

const isStrength = (r: InterpretationRule) => r.direction === 'strength' || r.direction === 'emphasis';

/**
 * Turns triggered rules into a structured, explainable summary:
 * dedupe → tier → reinforcing/conflict detection → templated sentences → audit trail.
 * Nothing is invented: every sentence is built from `summaryPhrase` of a triggered rule.
 */
export function synthesise(triggered: TriggeredRule[], a: Analysis): Synthesis {
  // 1–2. Remove duplicate conclusions (first catalogue entry wins).
  const seenKey = new Map<string, string>();
  const kept: TriggeredRule[] = [];
  const duplicatesRemoved: Synthesis['duplicatesRemoved'] = [];
  for (const t of triggered) {
    const key = t.rule.conclusionKey;
    if (key) {
      const first = seenKey.get(key);
      if (first) {
        duplicatesRemoved.push({ removed: t.rule.id, keptAs: first });
        continue;
      }
      seenKey.set(key, t.rule.id);
    }
    kept.push(t);
  }

  // 5. Primary vs secondary.
  const primary = kept.filter((t) => t.rule.priority === 1);
  const secondary = kept.filter((t) => t.rule.priority === 2);
  const context = kept.filter((t) => t.rule.priority === 3);

  // 3–4. Reinforcing / conflicting by shared project theme tags.
  const byTheme = new Map<string, TriggeredRule[]>();
  for (const t of kept) for (const th of t.rule.themes) byTheme.set(th, [...(byTheme.get(th) ?? []), t]);
  const reinforcing: Group[] = [];
  const conflicts: Group[] = [];
  for (const [theme, ts] of [...byTheme.entries()].sort(([x], [y]) => x.localeCompare(y))) {
    const strong = ts.filter((t) => isStrength(t.rule));
    const reflect = ts.filter((t) => t.rule.direction === 'reflection');
    if (strong.length >= 2 && reflect.length === 0) {
      reinforcing.push({
        theme,
        ruleIds: strong.map((t) => t.rule.id),
        explanation: `Several patterns point to the same theme ("${theme}"): ${strong.map((t) => t.rule.id).join(', ')}.`,
      });
    }
    if (strong.length >= 1 && reflect.length >= 1) {
      conflicts.push({
        theme,
        ruleIds: [...strong, ...reflect].map((t) => t.rule.id),
        explanation: `The theme "${theme}" appears both as a pattern the tradition treats as present (${strong
          .map((t) => t.rule.id)
          .join(', ')}) and as an area for reflection (${reflect
          .map((t) => t.rule.id)
          .join(', ')}). These are different aspects of the same theme in the tradition, not a contradiction about the person.`,
      });
    }
  }

  // 8. Unsupported / unavailable interpretations (never filled in).
  const unsupported: Unsupported[] = [];
  const partial = a.lines.filter((l) => l.state === 'partial');
  if (partial.length > 0) {
    unsupported.push({
      subject: `Digit-specific readings for partial lines (${partial.map((l) => l.def.digits.join('–')).join(', ')})`,
      reason: 'Partial lines are read only by how many of their three digits are present (generic moderate/weak tiers). No source gave readings that depend on which digits are present.',
    });
  }
  const repeated = a.digits.filter((d) => d.combinedCount >= 2);
  if (repeated.length > 0) {
    unsupported.push({
      subject: `Digit-specific readings for exact counts (${repeated.map((d) => `${d.digit}×${d.combinedCount}`).join(', ')})`,
      reason: 'A generic tier framework (2 strengthened, 3 excessive, 4+ dominant) is applied. Guides give more specific per-digit descriptions for some counts, but they could not be verified, so none is used.',
    });
  }
  if (a.mode.addsDriver || a.mode.addsDestiny) {
    unsupported.push({
      subject: 'Interactions between Driver/Destiny and Lo Shu lines',
      reason: 'No documented rule was verified for these interactions. Overlays only change counts; no extra interpretation is added.',
    });
  }
  unsupported.push({ subject: 'Kua as a grid overlay', reason: a.kua.reason });
  const matchedDigits = new Set(kept.flatMap((t) => [...t.rule.requiredDigits, ...t.rule.requiredCounts.map((c) => c.digit)]));
  if (kept.length === 0 || matchedDigits.size === 0) {
    unsupported.push({ subject: 'Whole chart', reason: 'No documented rule applies to this input.' });
  }

  // 6. Deterministic summary.
  const summary: string[] = [];
  const strengthsPrimary = primary.filter((t) => isStrength(t.rule)).map((t) => t.rule.summaryPhrase);
  const reflectPrimary = primary.filter((t) => t.rule.direction === 'reflection').map((t) => t.rule.summaryPhrase);
  if (strengthsPrimary.length > 0) {
    summary.push(`Within this tradition, the strongest patterns in this date are: ${listJoin(strengthsPrimary)}.`);
  } else {
    summary.push('No complete line or repeated number stands out in this date, so the tradition highlights no dominant pattern.');
  }
  if (reflectPrimary.length > 0) {
    summary.push(`The tradition offers these as areas for reflection rather than fixed weaknesses: ${listJoin(reflectPrimary)}.`);
  }
  const partialPhrases = secondary.filter((t) => t.rule.category === 'partial-line').map((t) => t.rule.summaryPhrase);
  if (partialPhrases.length > 0) {
    summary.push(`Partly formed lines (generic tiers): ${listJoin(partialPhrases)}.`);
  }
  const phrases = (cats: string[]) => context.filter((t) => cats.includes(t.rule.category)).map((t) => t.rule.summaryPhrase);
  const keyNumbers = phrases(['driver', 'destiny']);
  if (keyNumbers.length > 0) summary.push(`Key numbers: ${listJoin(keyNumbers)}.`);
  const planets = phrases(['planet-profile']);
  if (planets.length > 0) summary.push(`Planetary view (low confidence): ${listJoin(planets)}.`);
  const els = phrases(['element']);
  if (els.length > 0) summary.push(`Element view (low confidence): ${listJoin(els)}.`);
  const cyc = phrases(['cycle']);
  if (cyc.length > 0) summary.push(`Cycle (very low confidence, forecast-style): ${listJoin(cyc)}.`);
  if (reinforcing.length > 0) {
    summary.push(`Reinforcing themes: ${listJoin(reinforcing.map((g) => g.theme))}.`);
  }
  if (conflicts.length > 0) {
    summary.push(
      `Themes that appear on both sides, which the tradition treats as different aspects rather than contradictions: ${listJoin(conflicts.map((g) => g.theme))}.`,
    );
  }
  if (a.completeLineIds.length === 0) summary.push('No line is complete.');
  if (a.emptyLineIds.length === 0) summary.push('No line is entirely empty.');
  summary.push('These are traditional readings, not measured facts about a person.');

  // 7 + 9. Audit.
  const audit: AuditEntry[] = [
    ...kept.map((t): AuditEntry => ({
      ruleId: t.rule.id,
      tier: t.rule.priority === 1 ? 'primary' : t.rule.priority === 2 ? 'secondary' : 'context',
      included: true,
      why: t.why,
      note:
        t.rule.priority === 1
          ? 'Primary: a complete or empty line, a repeated number or a missing number.'
          : t.rule.priority === 2
            ? 'Secondary: supporting detail (a present number, a partly formed line or an association).'
            : 'Context: a key number or an optional reading (low confidence unless stated).',
    })),
    ...duplicatesRemoved.map((d): AuditEntry => ({
      ruleId: d.removed,
      tier: 'merged-duplicate',
      included: false,
      why: [],
      note: `Duplicate conclusion of ${d.keptAs}.`,
    })),
  ];

  return { primary, secondary, context, duplicatesRemoved, reinforcing, conflicts, unsupported, summary, audit };
}
