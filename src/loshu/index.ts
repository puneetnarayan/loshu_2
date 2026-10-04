import { RULES } from '../data/catalogue';
import type { DerivedKind, Extra, InterpretationRule } from '../data/schema';
import { analyse, verifyAnalysis } from './calculate';
import { evaluateRules } from './engine';
import { computeNameNumbers, personalYear } from './extras';
import { computeKua, resolvedKua } from './kua';
import type { KuaFormula, KuaResult } from './kua';
import type { CycleInfo, NameNumbers } from './extras';
import { synthesise } from './synthesis';
import type { Digit, OverlayModeId, ParsedDob } from './types';

export * from './types';
export * from './constants';
export * from './date';
export * from './calculate';
export * from './overlays';
export * from './engine';
export * from './synthesis';
export * from './extras';
export * from './frequency';
export * from './kua';
export * from './relations';

export interface Report {
  analysis: ReturnType<typeof analyse>;
  checks: ReturnType<typeof verifyAnalysis>;
  triggered: ReturnType<typeof evaluateRules>;
  synthesis: ReturnType<typeof synthesise>;
  /** Pythagorean name numbers, or null if no name letters were given. Never affects the grid. */
  nameNumbers: NameNumbers | null;
  /** Personal-year cycle for the as-of year. */
  cycle: CycleInfo;
  /** Kua (Eight Mansions) for both traditional formulas, with the Li Chun boundary handled. Never affects the grid. */
  kua: KuaResult;
  /** The formula whose Kua is interpreted (`both` interprets none). */
  kuaFormula: KuaFormula | 'both';
}

export interface ReportOptions {
  planetary?: boolean;
  extras?: readonly Extra[];
  name?: string;
  /** Which Kua formula to interpret; `both` (default) shows both without interpreting either. */
  kuaFormula?: KuaFormula | 'both';
  /** The "current" date used for the personal year. Injectable so results are reproducible. */
  asOf?: Date;
  rules?: readonly InterpretationRule[];
}

/**
 * The one function both tabs call. Basic always passes `dob-only` and no extras.
 * Same input + same options always produce the same Report.
 */
export function buildReport(dob: ParsedDob, mode: OverlayModeId = 'dob-only', opts: ReportOptions = {}): Report {
  const analysis = analyse(dob, mode);
  const extras = new Set<Extra>(opts.extras ?? []);
  if (opts.planetary) extras.add('planetary');
  const nameNumbers = computeNameNumbers(opts.name ?? '');
  const cycle = personalYear(dob, (opts.asOf ?? new Date()).getFullYear());
  const kua = computeKua(dob);
  const kuaFormula = opts.kuaFormula ?? 'both';
  const derived: Partial<Record<DerivedKind, Digit>> = { 'personal-year': cycle.personalYear.value };
  const kuaValue = resolvedKua(kua, kuaFormula);
  if (kuaValue !== null) derived.kua = kuaValue as Digit;
  if (nameNumbers) {
    derived.expression = nameNumbers.expression.value;
    if (nameNumbers.soulUrge) derived['soul-urge'] = nameNumbers.soulUrge.value;
    if (nameNumbers.personality) derived.personality = nameNumbers.personality.value;
  }
  const triggered = evaluateRules(opts.rules ?? RULES, analysis, { extras: [...extras], derived });
  return { analysis, checks: verifyAnalysis(analysis), triggered, synthesis: synthesise(triggered, analysis), nameNumbers, cycle, kua, kuaFormula };
}
