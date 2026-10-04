import { CONFIDENCE_LABELS, EVIDENCE_LABELS, FIDELITY_LABELS } from '../data/schema';
import type { Extra, InterpretationRule } from '../data/schema';
import { DIGIT_PLANETS, LINE_NAMES } from '../data/rules';
import { getSource } from '../data/sources';
import { valenceOf, VALENCE_TAG } from '../data/valence';
import type { Valence } from '../data/valence';
import { FREQUENCY_RANGE, patternFrequencies } from '../lookup';
import {
  analyse, compareAnalyses, GRID_LAYOUT, KUA_GROUP_DIRECTIONS, kuaGroup, kuaSteps, lineLabel, LINES, parseDob, personalMonths,
  planetProfile, POSITIONS, yearGrid,
} from '../loshu';
import type { Analysis, Digit, Report } from '../loshu';

/** Pastel framing used across the report: green good, yellow medium, red not good; `accent` is the single header colour. */
export type Tone = Valence | 'accent' | 'plain';

export interface Cell {
  text: string;
  tone?: Tone;
  bold?: boolean;
  center?: boolean;
}
export type TableRow = Array<string | Cell>;

export interface GridCellSpec {
  text: string;
  sub?: string;
  tone: Tone;
}
export interface GridSpec {
  title?: string;
  cells: GridCellSpec[][];
}

/** A neutral, renderer-independent description of the report (used by the PDF writer and the print view). */
export type Block =
  | { t: 'h1' | 'h2' | 'h3'; text: string }
  | { t: 'p'; text: string; style?: 'note' | 'normal' }
  | { t: 'ul'; items: string[] }
  | { t: 'legend' }
  | { t: 'table'; caption?: string; head?: string[]; rows: TableRow[]; widths?: number[] }
  | { t: 'grids'; caption?: string; size: 'large' | 'small'; grids: GridSpec[] };

export interface Brand {
  business: string;
  contact: string;
  operator: string;
}

export interface BlockOptions {
  name: string;
  brand?: Brand;
  extras: readonly Extra[];
  compareText: string;
  generated: string;
}

const STATE = { complete: 'Complete', partial: 'Partial', empty: 'Empty' } as const;
const STATUS = { missing: 'Missing', present: 'Present', repeated: 'Repeated' } as const;

/** Framing of a digit count, consistent with the readings: missing or four-plus is red, three is yellow, one or two is green. */
export const countTone = (n: number): Valence => (n === 0 ? 'negative' : n <= 2 ? 'positive' : n === 3 ? 'neutral' : 'negative');
export const lineTone = (state: 'complete' | 'partial' | 'empty'): Valence => (state === 'complete' ? 'positive' : state === 'partial' ? 'neutral' : 'negative');

export const TONE_KEY =
  'Colour key: green = good or positive, yellow = medium or mixed, red = not good or a challenge; the single lavender tint marks headers. Red is the tradition’s framing of a pattern, not a fault in you, and every coloured reading also has a text tag.';

const RIDERS: Record<Extra, string> = {
  planetary: 'Low confidence: the digit-to-planet mapping was confirmed by several search summaries (Indian scheme); the planet themes are general keywords, partly from background knowledge, and not verified.',
  elements: 'Low confidence: the element of each number comes from Feng Shui / Nine Star Ki, a different tradition from Indian Lo Shu numerology; the element themes were not verified.',
  kua: 'Low confidence: Kua is Feng Shui (Eight Mansions), a different tradition from the Lo Shu grid, and never changes the grid. Sources differ on the year boundary (Li Chun versus Chinese New Year); on 3-5 February the exact moment of Li Chun decides. Per-direction meanings were not visible and are not used.',
  relations: 'Very low confidence: friend/neutral/enemy tables disagree between sources, and the table used is internally inconsistent (row 8 lists 4 as both friendly and enemy). The page it came from was not opened. No verdict about people is made.',
  gemstones: 'Very low confidence: gemstone pairings come from search summaries of mostly jewellery retailers, who profit from sales; sources vary for 6, 7 and 9; there is no evidence that wearing any stone has an effect; stones can be costly. Do not buy a stone because of this.',
  remedies: 'Low confidence: remedies come from search summaries of commercial guides. No evidence that any traditional remedy changes anything; none is promised. Gemstone advice is omitted. Do not use remedies in place of professional advice.',
  cycle: 'Very low confidence: forecast-style reading from Western numerology, not Lo Shu tradition; generic, unvalidated meanings; no source text was read.',
  name: 'Very low confidence: a separate Pythagorean system; schools differ on Y, master numbers and which name to use; the readings reuse the Lo Shu keywords for each digit. The name never changes the grid.',
};

const tagCell = (v: Valence): Cell => ({ text: VALENCE_TAG[v], tone: v, bold: true, center: true });

/** Interpretation rules as a table: a coloured framing cell, the rule, its reading and a compact evidence cell. */
function ruleTable(items: Report['triggered'], caption?: string): Block {
  if (items.length === 0) return { t: 'p', text: 'None.' };
  return {
    t: 'table',
    caption,
    head: ['Framing', 'Rule', 'Reading', 'Evidence · source · confidence'],
    widths: [10, 18, 44, 28],
    rows: items.map((t) => {
      const r = t.rule;
      return [
        tagCell(valenceOf(r)),
        `${r.title}\n[${r.id}]`,
        r.advancedText,
        `${EVIDENCE_LABELS[r.evidenceClassification].short}; ${FIDELITY_LABELS[r.sourceFidelityStatus].short}; ${CONFIDENCE_LABELS[r.confidence].short}${r.confidence !== 'moderate' ? `\nRider: ${r.confidenceReason}` : ''}`,
      ];
    }),
  };
}

const digitGrid = (counts: (d: Digit) => number, sub: (n: number) => string, tone: (n: number) => Tone, title?: string): GridSpec => ({
  title,
  cells: GRID_LAYOUT.map((row) => row.map((d) => ({ text: String(d), sub: sub(counts(d)), tone: tone(counts(d)) }))),
});

function lineMap(a: Analysis): GridSpec[] {
  return a.lines.map((l) => ({
    title: `${lineLabel(l.def)} · ${STATE[l.state]}`,
    cells: GRID_LAYOUT.map((row) =>
      row.map((d) => {
        const on = l.def.digits.includes(d);
        return { text: String(d), tone: on ? lineTone(l.state) : 'plain' };
      }),
    ),
  }));
}

const COMPASS = [
  ['NW', 'N', 'NE'],
  ['W', '', 'E'],
  ['SW', 'S', 'SE'],
] as const;
const COMPASS_FULL: Record<string, string> = { NW: 'Northwest', N: 'North', NE: 'Northeast', W: 'West', E: 'East', SW: 'Southwest', S: 'South', SE: 'Southeast' };

function compass(kua: number | null, title: string): GridSpec {
  const group = kua === null ? null : kuaGroup(kua);
  const good = group ? KUA_GROUP_DIRECTIONS[group] : [];
  return {
    title,
    cells: COMPASS.map((row) =>
      row.map((c) =>
        c === ''
          ? { text: kua === null ? '—' : `Kua ${kua}`, sub: group ? `${group} group` : undefined, tone: 'accent' as Tone }
          : { text: c, tone: (good.includes(COMPASS_FULL[c]!) ? 'positive' : 'plain') as Tone },
      ),
    ),
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function reportBlocks(report: Report, o: BlockOptions): Block[] {
  const { analysis: a, triggered, synthesis, checks } = report;
  const passed = checks.filter((c) => c.passed).length;
  const cat = (...c: string[]) => triggered.filter((t) => c.includes(t.rule.category));
  const b: Block[] = [];
  const hasOverlay = a.digits.some((s) => s.overlayCount > 0);

  b.push({ t: 'h1', text: 'Lo Shu Grid report' });
  const brand = o.brand;
  if (brand && (brand.business.trim() || brand.contact.trim() || brand.operator.trim())) {
    const parts = [brand.business.trim(), brand.operator.trim() ? `Prepared by ${brand.operator.trim()}` : '', brand.contact.trim()].filter(Boolean);
    b.push({ t: 'p', text: parts.join(' · ') });
  }
  b.push({ t: 'p', text: `${o.name.trim() ? `Prepared for ${o.name.trim()} · ` : ''}Date of birth ${a.dob.normalised} · Mode: ${a.mode.label} · Generated ${o.generated}` });
  b.push({ t: 'p', style: 'note', text: 'Calculated locally in the browser. The name and date are not stored or transmitted. Traditional readings are not scientifically validated and are not advice.' });
  b.push({ t: 'legend' });

  // ---------------- 1. Grid ----------------
  b.push({ t: 'h2', text: '1. Grid' });
  b.push({
    t: 'grids',
    size: 'large',
    caption: 'Fixed Lo Shu layout; counts show the selected mode (raw DOB digits + overlay). Cell colour: green = appears once or twice, yellow = three times, red = missing or four or more.',
    grids: [digitGrid((d) => a.digits.find((s) => s.digit === d)!.combinedCount, (n) => `x${n}`, countTone)],
  });
  if (hasOverlay) {
    b.push({
      t: 'grids',
      size: 'small',
      caption: 'The two layers behind the grid above: raw date digits, the overlay additions (Driver / Destiny), and the combined view.',
      grids: [
        digitGrid((d) => a.digits.find((s) => s.digit === d)!.rawCount, (n) => `x${n}`, countTone, 'Raw DOB layer'),
        digitGrid((d) => a.digits.find((s) => s.digit === d)!.overlayCount, (n) => (n ? `+${n}` : '-'), (n) => (n ? 'accent' : 'plain'), 'Overlay additions'),
        digitGrid((d) => a.digits.find((s) => s.digit === d)!.combinedCount, (n) => `x${n}`, countTone, 'Combined'),
      ],
    });
  }

  // ---------------- 2. Calculation audit ----------------
  b.push({ t: 'h2', text: '2. Calculation audit' });
  b.push({
    t: 'table',
    head: ['Item', 'Value'],
    widths: [30, 70],
    rows: [
      ['Original input / normalised', `${a.audit.originalInput} / ${a.audit.normalisedDate}`],
      ['All digits (DDMMYYYY)', a.audit.allDigits.join(', ')],
      ['Zeros excluded', String(a.audit.zerosExcluded)],
      ['Non-zero digits', a.audit.nonZeroDigits.join(', ')],
      ['Present / missing / repeated (raw)', `${a.audit.presentSet.join(', ') || 'none'} / ${a.audit.missingSet.join(', ') || 'none'} / ${a.audit.repeatedSet.join(', ') || 'none'}`],
      ['Driver (Moolank)', `${a.driver.value}: ${a.driver.steps.join(' → ')}`],
      ['Destiny (Bhagyank)', `${a.destiny.value}: ${a.destiny.steps.join(' → ')}`],
      ['Kua as a grid overlay', 'Not used (shown separately as Feng Shui)'],
      ['Arithmetic checks', `${passed}/${checks.length} passed`],
    ],
  });
  const planetary = o.extras.includes('planetary');
  b.push({
    t: 'table',
    caption: 'Frequency table',
    head: ['Digit', 'Cell', 'Raw', 'Overlay', 'Total', 'Status in mode', ...(planetary ? ['Planet'] : [])],
    rows: a.digits.map((s) => [
      { text: String(s.digit), bold: true, center: true },
      s.position.label,
      { text: String(s.rawCount), center: true },
      { text: String(s.overlayCount), center: true },
      { text: String(s.combinedCount), center: true },
      { text: STATUS[s.effectiveStatus], tone: countTone(s.combinedCount) },
      ...(planetary ? [DIGIT_PLANETS[s.digit]] : []),
    ]),
  });

  // ---------------- 3. Lines ----------------
  b.push({ t: 'h2', text: '3. The eight lines' });
  b.push({
    t: 'table',
    head: ['Line', 'Type', 'Present', 'Missing', 'Weight', 'State', 'Traditional name'],
    widths: [10, 12, 11, 11, 9, 12, 35],
    rows: a.lines.map((l) => [
      { text: lineLabel(l.def), bold: true },
      l.def.kind,
      l.presentDigits.join(', ') || '-',
      l.missingDigits.join(', ') || '-',
      { text: String(l.weight), center: true },
      { text: STATE[l.state], tone: lineTone(l.state), bold: true },
      LINE_NAMES[l.def.id]?.name ?? '',
    ]),
  });
  b.push({ t: 'grids', size: 'small', caption: 'Line map: the three cells of each line are tinted by its state (green = complete, yellow = partial, red = entirely empty).', grids: lineMap(a) });

  // ---------------- 4. Interpretation ----------------
  b.push({ t: 'h2', text: '4. Interpretation (rule-based)' });
  b.push({
    t: 'table',
    caption: 'At a glance',
    head: ['Framing', 'Reading'],
    widths: [14, 86],
    rows: synthesis.summary.map((s, i): TableRow => {
      const v = synthesis.summaryValence[i];
      return [v ? tagCell(v) : { text: 'Note', tone: 'plain', center: true }, s];
    }),
  });
  b.push({ t: 'h3', text: 'Primary patterns' });
  b.push(ruleTable(synthesis.primary));
  b.push({ t: 'h3', text: 'Secondary patterns' });
  b.push(ruleTable(synthesis.secondary));
  if (synthesis.conflicts.length > 0) {
    b.push({ t: 'h3', text: 'Themes on both sides' });
    b.push({ t: 'table', head: ['Theme', 'Explanation'], widths: [18, 82], rows: synthesis.conflicts.map((g) => [{ text: g.theme, bold: true }, g.explanation]) });
  }
  b.push({ t: 'h3', text: 'Not covered by any documented rule' });
  b.push({ t: 'table', head: ['Subject', 'Why'], widths: [32, 68], rows: synthesis.unsupported.map((u) => [{ text: u.subject, bold: true }, u.reason]) });

  // ---------------- 5. Key numbers and frequency ----------------
  b.push({ t: 'h2', text: '5. Key numbers and how common the pattern is' });
  b.push({ t: 'p', style: 'note', text: 'Low confidence: Driver and Destiny meanings come from one search summary of several guides; no compatibility verdict is made.' });
  b.push({
    t: 'table',
    head: ['Number', 'Value', 'Working'],
    widths: [24, 12, 64],
    rows: [
      ['Driver (Moolank)', { text: String(a.driver.value), bold: true, center: true }, a.driver.steps.join(' → ')],
      ['Destiny (Bhagyank)', { text: String(a.destiny.value), bold: true, center: true }, a.destiny.steps.join(' → ')],
    ],
  });
  b.push(ruleTable(cat('driver', 'destiny')));
  if (o.extras.includes('relations')) {
    b.push({ t: 'h3', text: 'Driver and Destiny relation (very low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.relations });
    b.push(ruleTable(cat('relation')));
  }
  b.push({ t: 'p', text: `Share of all ${FREQUENCY_RANGE.dates.toLocaleString('en-GB')} calendar dates from ${FREQUENCY_RANGE.from} to ${FREQUENCY_RANGE.to} (not population-weighted) showing the same pattern in this mode. A common pattern is not special and a rare one is not meaningful in itself.` });
  b.push({ t: 'table', head: ['Pattern in this reading', 'Share of dates'], widths: [70, 30], rows: patternFrequencies(a).map((i) => [i.label, { text: `${i.percent.toFixed(2)}%`, center: true }]) });

  // ---------------- 6. Optional readings ----------------
  b.push({ t: 'h2', text: '6. Optional readings' });
  if (planetary) {
    const p = planetProfile(a, DIGIT_PLANETS);
    b.push({ t: 'h3', text: 'Planetary profile (low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.planetary });
    b.push({
      t: 'table',
      head: ['Planet', 'Digit', 'Count', 'Status'],
      widths: [30, 20, 20, 30],
      rows: p.rows.map((r) => [r.planet, { text: String(r.digit), center: true }, { text: String(r.count), center: true }, { text: STATUS[r.status], tone: countTone(r.count) }]),
    });
    b.push({ t: 'p', text: `Most repeated: ${p.dominant.join(', ') || 'none'}. Not represented: ${p.absent.join(', ') || 'none'}.` });
    b.push(ruleTable(cat('planet-profile', 'planetary')));
  }
  if (o.extras.includes('elements')) {
    b.push({ t: 'h3', text: 'Five elements (low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.elements });
    const elOf = (d: Digit) => a.elements.rows.find((r) => r.digits.includes(d))!.element;
    b.push({
      t: 'grids',
      size: 'small',
      caption: 'Elements on the Lo Shu grid (1 water; 2, 5, 8 earth; 3, 4 wood; 6, 7 metal; 9 fire). Cell colour follows the digit count.',
      grids: [{ cells: GRID_LAYOUT.map((row) => row.map((d) => ({ text: String(d), sub: elOf(d), tone: countTone(a.digits.find((s) => s.digit === d)!.combinedCount) }))) }],
    });
    b.push({
      t: 'table',
      head: ['Element', 'Digits', 'Total count', 'Present digits'],
      widths: [25, 25, 25, 25],
      rows: a.elements.rows.map((r) => [{ text: r.element, bold: true }, r.digits.join(', '), { text: String(r.count), center: true }, r.presentDigits.join(', ') || '-']),
    });
    b.push({ t: 'p', text: `Most represented: ${a.elements.dominant.join(', ') || 'none'}. Not represented: ${a.elements.absent.join(', ') || 'none'}.` });
    b.push(ruleTable(cat('element')));
  }
  if (o.extras.includes('kua')) {
    b.push({ t: 'h3', text: 'Kua number (low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.kua });
    b.push({ t: 'p', text: report.kua.note });
    const f = (n: number | null) => (n === null ? 'not available' : `${n} (${kuaGroup(n)} group: ${KUA_GROUP_DIRECTIONS[kuaGroup(n)].join(', ')})`);
    b.push({
      t: 'table',
      head: ['Assumes', 'Solar year', 'Male formula', 'Female formula'],
      widths: [16, 11, 36, 37],
      rows: report.kua.candidates.map((c) => [
        c.assumes === 'before-li-chun' ? 'Before Li Chun' : 'On or after Li Chun',
        { text: String(c.solarYear), center: true },
        `${f(c.male)}\n[${kuaSteps(c.solarYear, 'male')?.join(' → ') ?? '-'}]`,
        `${f(c.female)}\n[${kuaSteps(c.solarYear, 'female')?.join(' → ') ?? '-'}]`,
      ]),
    });
    b.push({
      t: 'grids',
      size: 'small',
      caption: 'Direction compass: the four group-level directions are tinted green (the tradition’s favourable set for that Kua); other directions stay plain.',
      grids: report.kua.candidates.flatMap((c) => [
        compass(c.male, `Male ${c.solarYear}`),
        compass(c.female, `Female ${c.solarYear}`),
      ]),
    });
    if (report.kuaFormula === 'both') b.push({ t: 'p', text: 'Both formulas are shown and neither is interpreted.' });
    b.push(ruleTable(cat('kua')));
  }
  if (o.extras.includes('remedies')) {
    b.push({ t: 'h3', text: 'Reported remedies (low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.remedies });
    b.push(ruleTable(cat('remedy').filter((t) => t.rule.subcategory !== 'gemstone')));
  }
  if (o.extras.includes('gemstones')) {
    b.push({ t: 'h3', text: 'Gemstones reported for the Driver number (very low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.gemstones });
    b.push(ruleTable(cat('remedy').filter((t) => t.rule.subcategory === 'gemstone')));
  }
  if (o.extras.includes('cycle')) {
    b.push({ t: 'h3', text: 'Personal year cycle (very low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.cycle });
    b.push({ t: 'p', text: `Personal Year for ${report.cycle.year}: ${report.cycle.personalYear.value} (${report.cycle.personalYear.steps.join(' → ')}).` });
    b.push(ruleTable(cat('cycle')));
    b.push({ t: 'p', style: 'note', text: 'Very low confidence: personal month = personal year + calendar month, reduced (formula agrees across summaries); no meanings per number were found, so none are given.' });
    const months = personalMonths(report.cycle.personalYear);
    b.push({
      t: 'grids',
      size: 'small',
      caption: `Personal month numbers for ${report.cycle.year} (month, then personal month).`,
      grids: [{ cells: [0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => { const m = months[r * 4 + c]!; return { text: MONTHS[m.month - 1]!, sub: String(m.value), tone: 'accent' as Tone }; })) }],
    });
    const yg = yearGrid(a, report.cycle.year);
    b.push({ t: 'p', style: 'note', text: 'Very low confidence: the yearly grid method is described only vaguely in one search summary (birth date digits combined with the digits of the year). This is descriptive arithmetic; no forecast is made.' });
    b.push({ t: 'p', text: `Year grid ${yg.year}: adds the digits ${yg.addedDigits.join(', ') || 'none'} to the raw date digits. Newly complete lines: ${yg.newlyComplete.length ? yg.newlyComplete.map((id) => id.slice(2).split('').join('–')).join(', ') : 'none'}. Newly non-empty lines: ${yg.newlyNonEmpty.length ? yg.newlyNonEmpty.map((id) => id.slice(2).split('').join('–')).join(', ') : 'none'}.` });
    b.push({
      t: 'grids',
      size: 'small',
      caption: 'Birth grid compared with the grid after adding the year’s digits.',
      grids: [
        digitGrid((d) => a.audit.rawCounts[d], (n) => `x${n}`, countTone, 'Birth grid'),
        digitGrid((d) => yg.counts[d], (n) => `x${n}`, countTone, `With ${yg.year} digits`),
      ],
    });
    b.push({
      t: 'table',
      head: ['Line', 'Birth grid', `With ${yg.year} digits`],
      widths: [20, 40, 40],
      rows: yg.lines.map((l) => [{ text: l.label, bold: true }, { text: STATE[l.before], tone: lineTone(l.before) }, { text: STATE[l.after], tone: lineTone(l.after) }]),
    });
  }
  if (o.extras.includes('name') && report.nameNumbers) {
    const n = report.nameNumbers;
    b.push({ t: 'h3', text: 'Name numbers (very low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.name });
    const row = (label: string, x: typeof n.expression | null): TableRow =>
      x ? [label, x.letters.map((l) => `${l.letter}${l.value}`).join(' '), x.chain.join(' → '), { text: String(x.value), bold: true, center: true }] : [label, 'No such letters', '-', '-'];
    b.push({
      t: 'table',
      head: ['Number', 'Letter values', 'Reduction', 'Result'],
      widths: [26, 44, 18, 12],
      rows: [row('Expression (all letters)', n.expression), row('Soul Urge (vowels)', n.soulUrge), row('Personality (consonants)', n.personality)],
    });
    b.push({ t: 'p', text: `Expression ${n.expression.chain.join(' → ')}${n.soulUrge ? `; Soul Urge ${n.soulUrge.chain.join(' → ')}` : ''}${n.personality ? `; Personality ${n.personality.chain.join(' → ')}` : ''}.` });
    b.push(ruleTable(cat('name')));
  }
  const second = o.compareText.trim() ? parseDob(o.compareText) : null;
  if (second && second.ok) {
    const mine = analyse(a.dob, 'dob-only');
    const other = analyse(second.dob, 'dob-only');
    const c = compareAnalyses(mine, other);
    const l = (ds: number[]) => ds.join(', ') || '-';
    b.push({ t: 'h3', text: `Comparison with ${other.dob.normalised} (descriptive arithmetic only)` });
    b.push({ t: 'p', style: 'note', text: 'No compatibility verdict is made; friend/enemy tables differ between sources and could not be verified.' });
    b.push({
      t: 'grids',
      size: 'small',
      caption: 'Raw date grids side by side.',
      grids: [
        digitGrid((d) => mine.audit.rawCounts[d], (n) => `x${n}`, countTone, mine.dob.normalised),
        digitGrid((d) => other.audit.rawCounts[d], (n) => `x${n}`, countTone, other.dob.normalised),
      ],
    });
    b.push({
      t: 'table',
      head: ['Set', 'Digits'],
      widths: [40, 60],
      rows: [
        ['Present in both', l(c.both)],
        [`Only in ${a.dob.normalised}`, l(c.onlyA)],
        [`Only in ${other.dob.normalised}`, l(c.onlyB)],
        ['Missing from both', l(c.neither)],
      ],
    });
    b.push({
      t: 'table',
      head: ['Line', mine.dob.normalised, other.dob.normalised],
      widths: [20, 40, 40],
      rows: c.lines.map((x) => [{ text: x.label, bold: true }, { text: x.a, tone: lineTone(x.a as 'complete' | 'partial' | 'empty') }, { text: x.b, tone: lineTone(x.b as 'complete' | 'partial' | 'empty') }]),
    });
    // keep the explicit sentence form too
    b.push({ t: 'p', text: `Present in both: ${l(c.both)}. Only in ${a.dob.normalised}: ${l(c.onlyA)}. Only in ${other.dob.normalised}: ${l(c.onlyB)}. Missing from both: ${l(c.neither)}.` });
  }

  // ---------------- 7. Evidence and limitations ----------------
  b.push({ t: 'h2', text: '7. Evidence and limitations' });
  b.push({
    t: 'table',
    head: ['Question', 'Status'],
    widths: [26, 74],
    rows: [
      ['Mathematical verification', `${passed === checks.length ? 'Calculation verified' : 'Check failed'} (${passed}/${checks.length} checks). Arithmetic only.`],
      ['Scientific evidence', 'Every reading is a traditional interpretation without established scientific validation. The closest empirical test found (Genovese, 2017, per a search summary) reported no link between birth numbers and Nobel Prize winners and does not test Lo Shu grids.'],
      ['Source fidelity', 'Wording is paraphrased from summaries of several web sources; no source page was opened, so it has not been compared with the source texts.'],
      ['Perceived fit', 'A reading can feel accurate for reasons unrelated to validity (the Barnum or Forer effect).'],
      ['Use', 'Do not use for medical, financial, legal or relationship decisions.'],
    ],
  });
  const reasons = new Map<string, { level: string; ids: string[] }>();
  for (const t of triggered) {
    const r: InterpretationRule = t.rule;
    if (r.confidence === 'moderate') continue;
    const e = reasons.get(r.confidenceReason) ?? { level: CONFIDENCE_LABELS[r.confidence].short, ids: [] };
    e.ids.push(r.id);
    reasons.set(r.confidenceReason, e);
  }
  if (reasons.size > 0) {
    b.push({
      t: 'table',
      caption: 'Confidence notes (riders) for the readings above, grouped by reason',
      head: ['Confidence', 'Applies to', 'Reason'],
      widths: [14, 26, 60],
      rows: [...reasons.entries()].map(([reason, e]): TableRow => [
        { text: e.level, tone: e.level.includes('Very') ? 'negative' : 'neutral', bold: true },
        e.ids.length > 6 ? `${e.ids.slice(0, 6).join(', ')} and ${e.ids.length - 6} more` : e.ids.join(', '),
        reason,
      ]),
    });
  }

  // ---------------- 8. Sources ----------------
  b.push({ t: 'h2', text: '8. Sources cited by the rules above' });
  const ids = [...new Set(triggered.flatMap((t) => t.rule.sourceIds))];
  const rows: TableRow[] = ids.flatMap((id, i) => {
    const s = getSource(id);
    return s ? [[{ text: String(i + 1), center: true }, s.title, s.url, s.accessMethod === 'search-summary-only' ? 'page not read; search summary only' : s.accessMethod] as TableRow] : [];
  });
  b.push({ t: 'table', head: ['#', 'Source', 'URL', 'Access'], widths: [5, 35, 40, 20], rows });
  return b;
}

/** Positions of digits, exported for tests and renderers that need the fixed layout. */
export const FIXED_POSITIONS = POSITIONS;
export const ALL_LINES = LINES;
