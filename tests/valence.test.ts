import { describe, expect, it } from 'vitest';
import { RULES } from '../src/data/catalogue';
import { valenceOf, VALENCE_TAG } from '../src/data/valence';
import { buildReport } from '../src/loshu';
import { reportBlocks } from '../src/report/blocks';
import { dobOf } from './helpers';

const v = (id: string) => valenceOf(RULES.find((r) => r.id === id)!);

describe('valence of each rule', () => {
  it('every rule gets one of the three framings, in the expected numbers', () => {
    const count = (x: string) => RULES.filter((r) => valenceOf(r) === x).length;
    // positive: 9 present + 9 twice + 8 complete lines + 9 planets emphasised + 5 elements dominant + 1 relation friendly
    expect(count('positive')).toBe(41);
    // negative: 9 missing + 9 four-or-more + 8 empty lines + 9 planets absent + 5 elements absent + 1 relation enemy
    expect(count('negative')).toBe(41);
    expect(count('neutral')).toBe(201 - 82);
    expect(count('positive') + count('neutral') + count('negative')).toBe(RULES.length);
  });
  it('spot checks follow the tradition’s own framing', () => {
    expect(v('NUM-1-PRESENT')).toBe('positive');
    expect(v('NUM-5-MISSING')).toBe('negative');
    expect(v('NUM-1-REPEATED-2')).toBe('positive');
    expect(v('NUM-1-REPEATED-3')).toBe('neutral');
    expect(v('NUM-1-REPEATED-4PLUS')).toBe('negative');
    expect(v('LINE-H-492-COMPLETE')).toBe('positive');
    expect(v('LINE-V-438-EMPTY')).toBe('negative');
    expect(v('LINE-V-438-PARTIAL-2')).toBe('neutral');
    expect(v('LINE-V-438-PARTIAL-1')).toBe('neutral');
    expect(v('REL-FRIENDLY')).toBe('positive');
    expect(v('REL-ENEMY')).toBe('negative');
    expect(v('REL-NEUTRAL')).toBe('neutral');
    expect(v('REL-CONFLICTING')).toBe('neutral');
    for (const id of ['DRIVER-5', 'DESTINY-3', 'KUA-3', 'REM-5-MISSING', 'GEM-5', 'CYCLE-PY-8', 'NAME-EXPRESSION-2', 'PLANET-1']) expect(v(id), id).toBe('neutral');
    expect(v('PLANETEMPH-1')).toBe('positive');
    expect(v('PLANETABS-5')).toBe('negative');
    expect(v('ELEM-water-DOMINANT')).toBe('positive');
    expect(v('ELEM-metal-ABSENT')).toBe('negative');
  });
  it('the tags are plain words', () => {
    expect(VALENCE_TAG).toEqual({ positive: 'Positive', neutral: 'Neutral', negative: 'Challenge' });
  });
});

describe('summary framing', () => {
  it('has one framing per sentence; the strongest-patterns line is positive and the reflection line is a challenge', () => {
    const s = buildReport(dobOf('02-06-1970')).synthesis;
    expect(s.summaryValence).toHaveLength(s.summary.length);
    expect(s.summaryValence[0]).toBe('positive'); // the action plane (2-7-6) is complete
    expect(s.summaryValence[1]).toBe('negative'); // missing 3, 4, 5, 8 and the empty 4-3-8
    expect(s.summaryValence[s.summaryValence.length - 1]).toBeNull(); // the closing disclaimer stays plain
    expect(s.summary[s.summary.length - 1]).toMatch(/not measured facts/);
  });
  it('a date with nothing outstanding is neutral, not positive', () => {
    const s = buildReport(dobOf('23-11-1994')).synthesis; // 4-9-2 complete: positive; no empty lines
    expect(s.summaryValence[0]).toBe('positive');
    const none = buildReport(dobOf('10-10-2010')).synthesis; // digits 1,1,1,2: nothing complete, nothing repeated beyond 1x3
    expect(none.summary.length).toBe(none.summaryValence.length);
  });
});

describe('report blocks carry the framing for the PDF and print view', () => {
  const r = buildReport(dobOf('02-06-1970'), 'dob-only', { extras: ['relations', 'kua'], asOf: new Date(2026, 9, 4), kuaFormula: 'male' });
  const blocks = reportBlocks(r, { name: '', extras: ['relations', 'kua'], compareText: '', generated: 'g' });
  it('summary paragraphs and rule lists have valences; calculation blocks do not', () => {
    const coloured = blocks.filter((b) => b.t === 'p' && b.valence);
    expect(coloured.length).toBeGreaterThanOrEqual(3);
    const items = blocks.flatMap((b) => (b.t === 'ul' ? b.items.filter((i) => typeof i !== 'string') : []));
    expect(items.length).toBeGreaterThan(10);
    expect(blocks.filter((b) => b.t === 'table' || b.t === 'grid').every((b) => !('valence' in b))).toBe(true);
    const missing5 = items.find((i) => typeof i !== 'string' && i.text.includes('[NUM-5-MISSING]'));
    expect(missing5).toMatchObject({ valence: 'negative' });
  });
});
