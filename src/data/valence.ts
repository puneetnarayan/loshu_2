import type { InterpretationRule } from './schema';

/** How a traditional reading is framed. Used only to colour interpretation text; never changes a calculation. */
export type Valence = 'positive' | 'neutral' | 'negative';

export const VALENCE_TAG: Record<Valence, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Challenge',
};

export const VALENCE_LEGEND =
  'Colour guide for the readings: green = positive, yellow = neutral or mixed, red = a challenge or area for reflection. Red is the tradition’s framing of a pattern, not a fault in you. Every coloured reading also carries a text tag.';

/**
 * Deterministic framing of each rule, from its category and sub-type:
 * present numbers, two repeats and complete lines are positive; missing numbers, four-or-more repeats and
 * entirely empty lines are challenges; partial lines, three repeats, Driver/Destiny, Kua, remedies, cycles and
 * name numbers are neutral. The framing follows the wording the tradition itself uses (strength versus area to work on).
 */
export function valenceOf(r: InterpretationRule): Valence {
  switch (r.category) {
    case 'number':
    case 'line':
      return 'positive';
    case 'missing-number':
    case 'empty-line':
      return 'negative';
    case 'repetition':
      return r.id.endsWith('-2') ? 'positive' : r.id.endsWith('-3') ? 'neutral' : 'negative';
    case 'planet-profile':
      return r.subcategory === 'emphasised' ? 'positive' : 'negative';
    case 'element':
      return r.subcategory === 'dominant' ? 'positive' : 'negative';
    case 'relation':
      return r.subcategory === 'friendly' ? 'positive' : r.subcategory === 'enemy' ? 'negative' : 'neutral';
    default:
      return 'neutral'; // partial-line, planetary, driver, destiny, kua, remedy, cycle, name
  }
}
