import { describe, expect, it } from 'vitest';
import { RULES } from '../src/data/rules';
import { SOURCES, getSource } from '../src/data/sources';
import type { InterpretationRule } from '../src/data/schema';
import { validateCatalogue } from '../src/data/validate';
import { LINES, analyse, buildReport, evaluateRules, matchRule, synthesise } from '../src/loshu';
import type { TriggeredRule } from '../src/loshu';
import { dobOf } from './helpers';

const ids = (ts: TriggeredRule[]) => ts.map((t) => t.rule.id);
const clone = (r: InterpretationRule): InterpretationRule => structuredClone(r);

describe('source and rule validation', () => {
  it('the shipped catalogue is valid', () => {
    expect(validateCatalogue(RULES, SOURCES)).toEqual([]);
  });
  it('has 45 number rules (present, missing, three repetition tiers), 16 line rules and 9 planetary rules with unique ids', () => {
    expect(RULES.filter((r) => ['number', 'missing-number', 'repetition'].includes(r.category))).toHaveLength(45);
    expect(RULES.filter((r) => ['line', 'empty-line'].includes(r.category))).toHaveLength(16);
    expect(RULES.filter((r) => r.category === 'planetary')).toHaveLength(9);
    expect(new Set(RULES.map((r) => r.id)).size).toBe(RULES.length);
  });
  it('covers every digit with present/missing/repeated and every line with complete/empty', () => {
    for (const d of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      for (const k of ['PRESENT', 'MISSING', 'REPEATED-2', 'REPEATED-3', 'REPEATED-4PLUS']) expect(RULES.some((r) => r.id === `NUM-${d}-${k}`)).toBe(true);
    }
    for (const l of LINES) for (const k of ['COMPLETE', 'EMPTY']) expect(RULES.some((r) => r.id === `LINE-${l.id}-${k}`)).toBe(true);
  });
  it('every source reference resolves in the registry', () => {
    for (const r of RULES) for (const s of r.sourceIds) expect(getSource(s)).toBeDefined();
  });
  it('never invents authors or dates: only the empirical paper has them, and it is flagged as not opened', () => {
    for (const s of SOURCES) {
      if (s.id === 'SRC-JASNH-BIRTHNUMBERS') continue;
      expect(s.publicationDate).toBeNull();
      expect(s.author).toBeNull();
    }
    const paper = getSource('SRC-JASNH-BIRTHNUMBERS')!;
    expect(paper).toMatchObject({ author: 'Jeremy Genovese', publicationDate: '2017-02', accessMethod: 'search-summary-only' });
    expect(paper.note).toMatch(/not opened/);
    expect(getSource('SRC-ASTROSAKI')!.accessMethod).toBe('not-accessible');
  });
  it('no source is marked as read in full (none could be opened)', () => {
    expect(SOURCES.filter((s) => s.accessMethod === 'read-in-full')).toEqual([]);
  });
  it('repetition tiers partition counts: 2, 3 and 4+ never overlap and cover 2..9', () => {
    for (let n = 0; n <= 9; n++) {
      const hits = RULES.filter((r) => r.id.startsWith('NUM-4-REPEATED') && r.requiredCounts.every((c) => (c.min === undefined || n >= c.min) && (c.max === undefined || n <= c.max)));
      expect(hits).toHaveLength(n >= 2 ? 1 : 0);
    }
  });
  it('every empty-line rule names the traditional label and flags the disputed ones', () => {
    const empties = RULES.filter((r) => r.category === 'empty-line');
    expect(empties).toHaveLength(8);
    for (const r of empties) expect(r.advancedText).toMatch(/Traditional label: "/);
    expect(empties.filter((r) => r.sourceFidelityStatus === 'sources-disagree').map((r) => r.id).sort()).toEqual(['LINE-D-258-EMPTY', 'LINE-D-456-EMPTY', 'LINE-V-438-EMPTY']);
  });
  it('planetary rules use the multi-summary label and only the planets of the Indian scheme', () => {
    const planets = RULES.filter((r) => r.category === 'planetary');
    expect(planets.every((r) => r.sourceFidelityStatus === 'multiple-summaries-agree')).toBe(true);
    expect(planets.map((r) => r.title.split(' and ')[1]!.split(' ')[0])).toEqual(['Sun', 'Moon', 'Jupiter', 'Rahu', 'Mercury', 'Venus', 'Ketu', 'Saturn', 'Mars']);
  });
  it('no rule claims strong fidelity or empirical status without a source read in full', () => {
    for (const r of RULES) {
      expect(['directly-documented', 'multiple-sources']).not.toContain(r.sourceFidelityStatus);
      expect(r.evidenceClassification).not.toBe('empirically-tested');
    }
  });
  it('rejects malformed records', () => {
    const base = clone(RULES[0]!);
    expect(validateCatalogue([base, base], SOURCES).join('\n')).toMatch(/Duplicate rule id/);
    expect(validateCatalogue([{ ...clone(base), sourceIds: ['NOPE'] }], SOURCES).join()).toMatch(/unknown sourceId/);
    expect(validateCatalogue([{ ...clone(base), basicText: ' ' }], SOURCES).join()).toMatch(/basicText is empty/);
    expect(validateCatalogue([{ ...clone(base), requiredDigits: [], requiredCounts: [], requiredLines: [] }], SOURCES).join()).toMatch(/no structured trigger/);
    expect(validateCatalogue([{ ...clone(base), requiredLines: [{ lineId: 'X-000', state: 'complete' }] }], SOURCES).join()).toMatch(/unknown line/);
    expect(validateCatalogue([{ ...clone(base), sourceFidelityStatus: 'directly-documented' }], SOURCES).join()).toMatch(/not read in full/);
    expect(validateCatalogue([{ ...clone(base), evidenceClassification: 'empirically-tested' }], SOURCES).join()).toMatch(/empirically-tested/);
    expect(validateCatalogue([{ ...clone(base), sourceAgreement: 'disputed', knownDisagreements: [] }], SOURCES).join()).toMatch(/disputed/);
  });
  it('flags bad source records', () => {
    const bad = [{ ...SOURCES[0]!, url: 'http://x.example', lastReviewed: 'yesterday' }];
    expect(validateCatalogue([], bad).join()).toMatch(/https/);
    expect(validateCatalogue([], bad).join()).toMatch(/lastReviewed/);
  });
  it('lets the engine run a replaced catalogue without engine changes', () => {
    const custom: InterpretationRule = { ...clone(RULES[0]!), id: 'CUSTOM-1', requiredDigits: [4] };
    const report = buildReport(dobOf('23-11-1994'), 'dob-only', { rules: [custom] });
    expect(ids(report.triggered)).toEqual(['CUSTOM-1']);
  });
});

describe('rule matching on the 23-11-1994 fixture', () => {
  const a = analyse(dobOf('23-11-1994'));
  const triggered = evaluateRules(RULES, a);
  it('triggers exactly the expected rules (hand-derived)', () => {
    // present 1,2,3,4,9; missing 5,6,7,8; repeated 1,9; complete line 492.
    const expected = [
      ...[1, 2, 3, 4, 9].map((d) => `NUM-${d}-PRESENT`),
      ...[5, 6, 7, 8].map((d) => `NUM-${d}-MISSING`),
      'NUM-1-REPEATED-3', 'NUM-9-REPEATED-2', 'LINE-H-492-COMPLETE',
    ];
    expect(ids(triggered).sort()).toEqual(expected.sort());
  });
  it('does not trigger planetary rules unless enabled', () => {
    expect(ids(triggered).some((i) => i.startsWith('PLANET'))).toBe(false);
    const withPlanets = evaluateRules(RULES, a, { planetary: true });
    expect(ids(withPlanets).filter((i) => i.startsWith('PLANET')).sort()).toEqual(['PLANET-1', 'PLANET-2', 'PLANET-3', 'PLANET-4', 'PLANET-9']);
  });
  it('a present-once digit is not treated as repeated', () => {
    expect(ids(triggered).filter((i) => i.startsWith('NUM-2-REPEATED') || i.startsWith('NUM-4-REPEATED'))).toEqual([]);
    expect(ids(triggered)).not.toContain('NUM-1-REPEATED-2');
  });
  it('explains why each rule fired using the actual input', () => {
    const t = triggered.find((x) => x.rule.id === 'NUM-1-REPEATED-3')!;
    expect(t.why.join(' ')).toMatch(/Digit 1 occurs 3 times/);
    const l = triggered.find((x) => x.rule.id === 'LINE-H-492-COMPLETE')!;
    expect(l.why.join(' ')).toMatch(/Line 4–9–2 is complete/);
  });
  it('overlay changes which rules fire without touching the raw layer', () => {
    const o = evaluateRules(RULES, analyse(dobOf('23-11-1994'), 'dob-driver-destiny'));
    expect(ids(o)).toContain('NUM-5-PRESENT');
    expect(ids(o)).not.toContain('NUM-5-MISSING');
    expect(ids(o)).toContain('NUM-3-REPEATED-2');
  });
  it('matchRule supports min, max and not-complete conditions', () => {
    const base = clone(RULES.find((r) => r.id === 'NUM-1-REPEATED-2')!);
    expect(matchRule({ ...base, requiredCounts: [{ digit: 1, min: 4 }] }, a, { planetary: false })).toBeNull();
    expect(matchRule({ ...base, requiredCounts: [{ digit: 1, min: 1, max: 3 }] }, a, { planetary: false })).not.toBeNull();
    expect(matchRule({ ...base, requiredCounts: [], requiredDigits: [], requiredLines: [{ lineId: 'H-357', state: 'not-complete' }] }, a, { planetary: false })).not.toBeNull();
    expect(matchRule({ ...base, requiredCounts: [], requiredDigits: [], requiredLines: [{ lineId: 'H-492', state: 'not-complete' }] }, a, { planetary: false })).toBeNull();
  });
});

describe('synthesis', () => {
  const dob = dobOf('23-11-1994');
  const report = buildReport(dob);
  it('separates primary from secondary patterns', () => {
    expect(ids(report.synthesis.primary).sort()).toEqual(
      ['LINE-H-492-COMPLETE', 'NUM-1-REPEATED-3', 'NUM-5-MISSING', 'NUM-6-MISSING', 'NUM-7-MISSING', 'NUM-8-MISSING', 'NUM-9-REPEATED-2'].sort(),
    );
    expect(ids(report.synthesis.secondary).sort()).toEqual(['NUM-1-PRESENT', 'NUM-2-PRESENT', 'NUM-3-PRESENT', 'NUM-4-PRESENT', 'NUM-9-PRESENT']);
  });
  it('finds reinforcing themes', () => {
    const themes = report.synthesis.reinforcing.map((g) => g.theme);
    expect(themes).toEqual(expect.arrayContaining(['independence', 'initiative', 'idealism', 'energy']));
  });
  it('flags themes that appear as both pattern and reflection area, with an explanation', () => {
    const c = report.synthesis.conflicts.find((g) => g.theme === 'organisation')!;
    expect(c.ruleIds).toEqual(expect.arrayContaining(['NUM-4-PRESENT', 'NUM-8-MISSING']));
    expect(c.explanation).toMatch(/not a contradiction/);
  });
  it('lists unsupported interpretations instead of filling gaps', () => {
    const subjects = report.synthesis.unsupported.map((u) => u.subject).join(' | ');
    expect(subjects).toMatch(/Partially populated lines/);
    expect(subjects).toMatch(/Digit-specific readings for exact counts/);
    expect(subjects).toMatch(/Kua/);
    expect(subjects).not.toMatch(/Driver\/Destiny and Lo Shu lines/); // DOB-only: no overlay interaction note
    const o = buildReport(dob, 'dob-driver-destiny').synthesis.unsupported.map((u) => u.subject).join(' | ');
    expect(o).toMatch(/Driver\/Destiny and Lo Shu lines/);
  });
  it('says so when no documented rule applies', () => {
    const none = synthesise([], analyse(dob));
    expect(none.unsupported.map((u) => u.subject)).toContain('Whole chart');
    expect(none.summary[0]).toMatch(/No complete line or repeated number/);
  });
  it('is deterministic', () => {
    const again = buildReport(dob);
    expect(JSON.stringify(again.synthesis)).toBe(JSON.stringify(report.synthesis));
    expect(report.synthesis.summary).toEqual(again.synthesis.summary);
  });
  it('builds the summary only from triggered rule phrases and caveats it', () => {
    const text = report.synthesis.summary.join(' ');
    expect(text).toMatch(/a strong emphasis on independence \(repeated 1\), appearing three times/);
    expect(text).toMatch(/the mental plane \(4–9–2\) is complete/);
    expect(text).toMatch(/goals and resource management \(missing 8\)/);
    expect(text).toMatch(/not measured facts/);
    expect(text).not.toMatch(/\(5\)\s*,/); // no planetary text unless enabled
  });
  it('records an audit entry with reasons for every included rule', () => {
    for (const t of report.triggered) {
      const e = report.synthesis.audit.find((x) => x.ruleId === t.rule.id)!;
      expect(e.included).toBe(true);
      expect(e.why.length).toBeGreaterThan(0);
    }
  });
  it('removes duplicate conclusions that share a conclusionKey', () => {
    const a = analyse(dob);
    const r1 = { ...clone(RULES.find((r) => r.id === 'NUM-1-PRESENT')!), id: 'DUP-A', conclusionKey: 'same' };
    const r2 = { ...clone(RULES.find((r) => r.id === 'NUM-2-PRESENT')!), id: 'DUP-B', conclusionKey: 'same' };
    const s = synthesise(evaluateRules([r1, r2], a), a);
    expect(s.duplicatesRemoved).toEqual([{ removed: 'DUP-B', keptAs: 'DUP-A' }]);
    expect(ids(s.secondary)).toEqual(['DUP-A']);
    expect(s.audit.find((e) => e.ruleId === 'DUP-B')).toMatchObject({ tier: 'merged-duplicate', included: false });
  });
  it('detects synthetic conflicting interpretations on a shared theme', () => {
    const a = analyse(dob);
    const strong = { ...clone(RULES.find((r) => r.id === 'NUM-1-PRESENT')!), id: 'S-1', themes: ['x'] };
    const weak = { ...clone(RULES.find((r) => r.id === 'NUM-5-MISSING')!), id: 'S-2', themes: ['x'] };
    const s = synthesise(evaluateRules([strong, weak], a), a);
    expect(s.conflicts).toHaveLength(1);
    expect(s.conflicts[0]!.ruleIds).toEqual(['S-1', 'S-2']);
    expect(s.reinforcing).toHaveLength(0);
  });
});

describe('Basic and Advanced share one source of truth', () => {
  it('produces identical analyses, triggered rules and summaries for the same input', () => {
    for (const text of ['23-11-1994', '05-05-2005', '29-02-2000', '31-12-1999']) {
      const dob = dobOf(text);
      const basic = buildReport(dob, 'dob-only');
      const advanced = buildReport(dob, 'dob-only', { planetary: false });
      expect(advanced).toEqual(basic);
    }
  });
  it('switching Advanced overlay mode does not change the raw audit or the DOB-only report', () => {
    const dob = dobOf('05-05-2005');
    const before = buildReport(dob, 'dob-only');
    const overlaid = buildReport(dob, 'dob-driver-destiny', { planetary: true });
    expect(overlaid.analysis.audit).toEqual(before.analysis.audit);
    expect(buildReport(dob, 'dob-only')).toEqual(before);
  });
  it('empty lines are interpreted from the raw date: 05-05-2005', () => {
    const r = buildReport(dobOf('05-05-2005'));
    expect(ids(r.triggered)).toEqual(expect.arrayContaining(['LINE-H-816-EMPTY', 'LINE-V-438-EMPTY']));
    expect(ids(r.triggered).filter((i) => i.endsWith('COMPLETE'))).toEqual([]);
  });
});
