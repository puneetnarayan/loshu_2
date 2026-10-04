import type { InterpretationRule } from '../data/schema';
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

/** Returns the reasons if the rule matches, otherwise null. Pure and deterministic. */
export function matchRule(rule: InterpretationRule, a: Analysis, opts: { planetary: boolean }): string[] | null {
  if (rule.activation === 'planetary' && !opts.planetary) return null;
  const counts = countsOf(a);
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
    why.push(`Line ${line.def.digits.join('–')} is ${line.state} (digits present: ${line.presentDigits.join(', ') || 'none'}).`);
  }
  return why;
}

/** Evaluate all rules against one analysis. Output order follows catalogue order. */
export function evaluateRules(
  rules: readonly InterpretationRule[],
  a: Analysis,
  opts: { planetary: boolean } = { planetary: false },
): TriggeredRule[] {
  const out: TriggeredRule[] = [];
  for (const rule of rules) {
    const why = matchRule(rule, a, opts);
    if (why) out.push({ rule, why });
  }
  return out;
}
