import { parseDob } from '../src/loshu';
import type { ParsedDob } from '../src/loshu';

export const TODAY = new Date(2026, 9, 4); // fixed "today" so tests are deterministic

export function dobOf(text: string): ParsedDob {
  const r = parseDob(text, TODAY);
  if (!r.ok) throw new Error(`fixture ${text} should parse: ${r.error}`);
  return r.dob;
}
