import type { Relation } from '../data/schema';
import type { Digit } from './types';

/**
 * One published friendly / neutral / enemy table for numbers 1–9, taken from a search summary of a numerology site
 * (page not opened). It is NOT reliable: another table seen only for rows 1–4 disagrees (for example it lists 1 as
 * enemy of 4, 6, 7 and 8, while this one lists only 8), and row 8 here lists 4 as both friendly and enemy.
 * Rows are read "number → other number"; the table is not symmetric.
 */
export const RELATION_TABLE: Record<Digit, { friendly: readonly number[]; enemy: readonly number[]; neutral: readonly number[] }> = {
  1: { friendly: [1, 2, 3, 5, 6, 9], enemy: [8], neutral: [4, 7] },
  2: { friendly: [1, 2, 3, 5], enemy: [8, 4, 9], neutral: [7, 6] },
  3: { friendly: [1, 2, 3, 5, 7], enemy: [6], neutral: [4, 8, 9] },
  4: { friendly: [1, 5, 7, 6, 4, 8], enemy: [2, 9], neutral: [3] },
  5: { friendly: [1, 2, 3, 5, 6], enemy: [], neutral: [4, 7, 8, 9] },
  6: { friendly: [1, 4, 5, 6, 7], enemy: [3], neutral: [2, 8, 9] },
  7: { friendly: [1, 3, 4, 5, 6], enemy: [2], neutral: [8, 7, 9] },
  8: { friendly: [5, 3, 6, 7, 4, 8], enemy: [1, 2, 4], neutral: [9] },
  9: { friendly: [1, 5, 3], enemy: [4, 2], neutral: [9, 7, 6, 8] },
};

/**
 * Relation of `to` as listed in the row of `from`. `conflicting` when the table lists it in more than one column
 * (row 8 lists 4 as both friendly and enemy), so no relation is claimed.
 */
export function relationOf(from: Digit, to: Digit): Relation | null {
  const row = RELATION_TABLE[from];
  const hits: Relation[] = [];
  if (row.friendly.includes(to)) hits.push('friendly');
  if (row.neutral.includes(to)) hits.push('neutral');
  if (row.enemy.includes(to)) hits.push('enemy');
  if (hits.length === 0) return null;
  return hits.length > 1 ? 'conflicting' : hits[0]!;
}
