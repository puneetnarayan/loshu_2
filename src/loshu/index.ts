import { RULES } from '../data/rules';
import type { InterpretationRule } from '../data/schema';
import { analyse, verifyAnalysis } from './calculate';
import { evaluateRules } from './engine';
import { synthesise } from './synthesis';
import type { OverlayModeId, ParsedDob } from './types';

export * from './types';
export * from './constants';
export * from './date';
export * from './calculate';
export * from './overlays';
export * from './engine';
export * from './synthesis';

export interface Report {
  analysis: ReturnType<typeof analyse>;
  checks: ReturnType<typeof verifyAnalysis>;
  triggered: ReturnType<typeof evaluateRules>;
  synthesis: ReturnType<typeof synthesise>;
}

/**
 * The one function both tabs call. Basic always passes `dob-only`.
 * Same input + same options always produce the same Report.
 */
export function buildReport(
  dob: ParsedDob,
  mode: OverlayModeId = 'dob-only',
  opts: { planetary?: boolean; rules?: readonly InterpretationRule[] } = {},
): Report {
  const analysis = analyse(dob, mode);
  const triggered = evaluateRules(opts.rules ?? RULES, analysis, { planetary: opts.planetary ?? false });
  return { analysis, checks: verifyAnalysis(analysis), triggered, synthesis: synthesise(triggered, analysis) };
}
