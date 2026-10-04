import type { DerivedKind, Extra, InterpretationRule } from '../data/schema';
import type { Analysis, Digit } from './types';

export interface TriggeredRule {
  rule: InterpretationRule;
  /** Plain-language reasons the rule fired, built from the actual analysis. */
  why: string[];
}

function countsOf(a: Analysis): Record<Digit, number> {
  const out = {} as Record<Digit, number>;
  for (const s of a.digits) out[s.digit] = s.combinedCount;
  return out;
}

export type DerivedValues = Partial<Record<DerivedKind, Digit>>;

export interface EvalOptions {
  /** Backwards-compatible switch for the planetary extra. */
  planetary?: boolean;
  extras?: readonly Extra[];
  /** Name numbers and the personal year. Driver and Destiny are always taken from the analysis. */
  derived?: DerivedValues;
}

const KIND_LABEL: Record<DerivedKind, string> = {
  driver: 'Driver',
  destiny: 'Destiny',
  expression: 'Expression number',
  'soul-urge': 'Soul Urge number',
  personality: 'Personality number',
  'personal-year': 'Personal Year number',
};

/** Returns the reasons if the rule matches, otherwise null. Pure and deterministic. */
export function matchRule(rule: InterpretationRule, a: Analysis, opts: EvalOptions = {}): string[] | null {
  if (rule.activation !== 'default') {
    const on = new Set<Extra>(opts.extras ?? []);
    if (opts.planetary) on.add('planetary');
    if (!on.has(rule.activation)) return null;
  }
  const counts = countsOf(a);
  const derived: DerivedValues = { driver: a.driver.value, destiny: a.destiny.value, ...opts.derived };
  const why: string[] = [];
  for (const d of rule.requiredDigits) {
    if (counts[d] < 1) return null;
    why.push(`Digit ${d} occurs ${counts[d]} time${counts[d] === 1 ? '' : 's'} (needs at least 1).`);
  }
  for (const c of rule.requiredCounts) {
    const n = counts[c.digit];
    if (c.min !== undefined && n < c.min) return null;
    if (c.max !== undefined && n > c.max) return null;
    const bound = c.min !== undefined && c.max !== undefined ? `${c.min}–${c.max}` : c.min !== undefined ? `at least ${c.min}` : `at most ${c.max}`;
    why.push(`Digit ${c.digit} occurs ${n} time${n === 1 ? '' : 's'} (rule needs ${bound}).`);
  }
  for (const l of rule.requiredLines) {
    const line = a.lines.find((x) => x.def.id === l.lineId);
    if (!line) return null;
    const ok = l.state === 'not-complete' ? line.state !== 'complete' : line.state === l.state;
    if (!ok) return null;
    if (l.presentCount !== undefined && line.presentDigits.length !== l.presentCount) return null;
    why.push(`Line ${line.def.digits.join('–')} is ${line.state} (digits present: ${line.presentDigits.join(', ') || 'none'}).`);
  }
  for (const c of rule.requiredDerived ?? []) {
    const v = derived[c.kind];
    if (v !== c.value) return null;
    why.push(`${KIND_LABEL[c.kind]} is ${v}.`);
  }
  for (const c of rule.requiredElements ?? []) {
    const row = a.elements.rows.find((r) => r.element === c.element);
    if (!row) return null;
    if (c.state === 'absent') {
      if (row.count !== 0) return null;
      why.push(`No ${c.element}-element digit (${row.digits.join(', ')}) is present.`);
    } else {
      if (!a.elements.dominant.includes(c.element)) return null;
      why.push(`${c.element} has the highest element total (${row.count}; digits ${row.digits.join(', ')}).`);
    }
  }
  return why;
}

/** Evaluate all rules against one analysis. Output order follows catalogue order. */
export function evaluateRules(
  rules: readonly InterpretationRule[],
  a: Analysis,
  opts: EvalOptions = {},
): TriggeredRule[] {
  const out: TriggeredRule[] = [];
  for (const rule of rules) {
    const why = matchRule(rule, a, opts);
    if (why) out.push({ rule, why });
  }
  return out;
}
