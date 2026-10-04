import { EXTRA_RULES } from './extraRules';
import { CORE_RULES } from './rules';
import type { InterpretationRule } from './schema';

/** The complete interpretation catalogue used by the engine. */
export const RULES: readonly InterpretationRule[] = [...CORE_RULES, ...EXTRA_RULES];
