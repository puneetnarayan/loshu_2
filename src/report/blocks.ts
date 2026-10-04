import { CONFIDENCE_LABELS, EVIDENCE_LABELS, FIDELITY_LABELS } from '../data/schema';
import type { Extra } from '../data/schema';
import { DIGIT_PLANETS, LINE_NAMES } from '../data/rules';
import { getSource } from '../data/sources';
import { valenceOf, VALENCE_LEGEND } from '../data/valence';
import type { Valence } from '../data/valence';
import { FREQUENCY_RANGE, patternFrequencies } from '../lookup';
import { analyse, compareAnalyses, GRID_LAYOUT, KUA_GROUP_DIRECTIONS, kuaGroup, kuaSteps, lineLabel, parseDob, personalMonths, planetProfile, yearGrid } from '../loshu';
import type { Report } from '../loshu';

/** A neutral, renderer-independent description of the report (used by the PDF writer). */
export type Block =
  | { t: 'h1' | 'h2' | 'h3'; text: string }
  | { t: 'p'; text: string; style?: 'note' | 'normal'; valence?: Valence }
  | { t: 'ul'; items: Array<string | { text: string; valence: Valence }> }
  | { t: 'table'; caption?: string; head?: string[]; rows: string[][] }
  | { t: 'grid'; caption: string; cells: Array<Array<{ digit: number; line1: string; line2: string }>> };

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

function rules(items: Report['triggered']): Block {
  if (items.length === 0) return { t: 'p', text: 'None.' };
  return {
    t: 'ul',
    items: items.map((t) => {
      const r = t.rule;
      const rider = r.confidence !== 'moderate' ? ` Rider: ${r.confidenceReason}` : '';
      return {
        valence: valenceOf(r),
        text: `${r.title} [${r.id}]: ${r.advancedText} (${EVIDENCE_LABELS[r.evidenceClassification].short}; ${FIDELITY_LABELS[r.sourceFidelityStatus].short}; ${CONFIDENCE_LABELS[r.confidence].short}).${rider}`,
      };
    }),
  };
}

export function reportBlocks(report: Report, o: BlockOptions): Block[] {
  const { analysis: a, triggered, synthesis, checks } = report;
  const passed = checks.filter((c) => c.passed).length;
  const cat = (...c: string[]) => triggered.filter((t) => c.includes(t.rule.category));
  const b: Block[] = [];

  b.push({ t: 'h1', text: 'Lo Shu Grid report' });
  const brand = o.brand;
  if (brand && (brand.business.trim() || brand.contact.trim() || brand.operator.trim())) {
    const parts = [brand.business.trim(), brand.operator.trim() ? `Prepared by ${brand.operator.trim()}` : '', brand.contact.trim()].filter(Boolean);
    b.push({ t: 'p', text: parts.join(' · ') });
  }
  b.push({ t: 'p', text: `${o.name.trim() ? `Prepared for ${o.name.trim()} · ` : ''}Date of birth ${a.dob.normalised} · Mode: ${a.mode.label} · Generated ${o.generated}` });
  b.push({ t: 'p', style: 'note', text: 'Calculated locally in the browser. The name and date are not stored or transmitted. Traditional readings are not scientifically validated and are not advice.' });

  b.push({ t: 'h2', text: '1. Grid' });
  b.push({
    t: 'grid',
    caption: 'Fixed Lo Shu layout; counts show the selected mode (raw DOB digits + overlay)',
    cells: GRID_LAYOUT.map((row) =>
      row.map((d) => {
        const s = a.digits.find((x) => x.digit === d)!;
        return { digit: d, line1: `x${s.combinedCount} · ${STATUS[s.effectiveStatus]}`, line2: `raw ${s.rawCount} + overlay ${s.overlayCount}` };
      }),
    ),
  });

  b.push({ t: 'h2', text: '2. Calculation audit' });
  b.push({
    t: 'table',
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
    rows: a.digits.map((s) => [String(s.digit), s.position.label, String(s.rawCount), String(s.overlayCount), String(s.combinedCount), STATUS[s.effectiveStatus], ...(planetary ? [DIGIT_PLANETS[s.digit]] : [])]),
  });

  b.push({ t: 'h2', text: '3. The eight lines' });
  b.push({
    t: 'table',
    head: ['Line', 'Type', 'Present', 'Missing', 'Weight', 'State', 'Traditional name'],
    rows: a.lines.map((l) => [lineLabel(l.def), l.def.kind, l.presentDigits.join(', ') || '-', l.missingDigits.join(', ') || '-', String(l.weight), STATE[l.state], LINE_NAMES[l.def.id]?.name ?? '']),
  });

  b.push({ t: 'h2', text: '4. Interpretation (rule-based)' });
  b.push({ t: 'p', style: 'note', text: VALENCE_LEGEND });
  synthesis.summary.forEach((s, i) => b.push({ t: 'p', text: s, valence: synthesis.summaryValence[i] ?? undefined }));
  b.push({ t: 'h3', text: 'Primary patterns' });
  b.push(rules(synthesis.primary));
  b.push({ t: 'h3', text: 'Secondary patterns' });
  b.push(rules(synthesis.secondary));
  if (synthesis.conflicts.length > 0) {
    b.push({ t: 'h3', text: 'Themes on both sides' });
    b.push({ t: 'ul', items: synthesis.conflicts.map((g) => g.explanation) });
  }
  b.push({ t: 'h3', text: 'Not covered by any documented rule' });
  b.push({ t: 'ul', items: synthesis.unsupported.map((u) => `${u.subject}: ${u.reason}`) });

  b.push({ t: 'h2', text: '5. Key numbers and how common the pattern is' });
  b.push({ t: 'p', style: 'note', text: 'Low confidence: Driver and Destiny meanings come from one search summary of several guides; no compatibility verdict is made.' });
  b.push(rules(cat('driver', 'destiny')));
  if (o.extras.includes('relations')) {
    b.push({ t: 'h3', text: 'Driver and Destiny relation (very low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.relations });
    b.push(rules(cat('relation')));
  }
  b.push({ t: 'p', text: `Share of all ${FREQUENCY_RANGE.dates.toLocaleString('en-GB')} calendar dates from ${FREQUENCY_RANGE.from} to ${FREQUENCY_RANGE.to} (not population-weighted) showing the same pattern in this mode. A common pattern is not special and a rare one is not meaningful in itself.` });
  b.push({ t: 'table', rows: patternFrequencies(a).map((i) => [i.label, `${i.percent.toFixed(2)}%`]) });

  b.push({ t: 'h2', text: '6. Optional readings' });
  if (planetary) {
    const p = planetProfile(a, DIGIT_PLANETS);
    b.push({ t: 'h3', text: 'Planetary profile (low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.planetary });
    b.push({ t: 'p', text: `Most repeated: ${p.dominant.join(', ') || 'none'}. Not represented: ${p.absent.join(', ') || 'none'}.` });
    b.push(rules(cat('planet-profile', 'planetary')));
  }
  if (o.extras.includes('elements')) {
    b.push({ t: 'h3', text: 'Five elements (low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.elements });
    b.push({ t: 'p', text: `${a.elements.rows.map((r) => `${r.element} ${r.count}`).join(' · ')}. Most represented: ${a.elements.dominant.join(', ') || 'none'}. Not represented: ${a.elements.absent.join(', ') || 'none'}.` });
    b.push(rules(cat('element')));
  }
  if (o.extras.includes('kua')) {
    b.push({ t: 'h3', text: 'Kua number (low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.kua });
    b.push({ t: 'p', text: report.kua.note });
    const f = (n: number | null) => (n === null ? 'not available' : `${n} (${kuaGroup(n)} group: ${KUA_GROUP_DIRECTIONS[kuaGroup(n)].join(', ')})`);
    b.push({
      t: 'ul',
      items: report.kua.candidates.map(
        (c) => `${c.assumes === 'before-li-chun' ? 'Before Li Chun' : 'On or after Li Chun'}, solar year ${c.solarYear}: male formula ${f(c.male)} [${kuaSteps(c.solarYear, 'male')?.join(' → ') ?? '-'}]; female formula ${f(c.female)} [${kuaSteps(c.solarYear, 'female')?.join(' → ') ?? '-'}].`,
      ),
    });
    if (report.kuaFormula === 'both') b.push({ t: 'p', text: 'Both formulas are shown and neither is interpreted.' });
    b.push(rules(cat('kua')));
  }
  if (o.extras.includes('remedies')) {
    b.push({ t: 'h3', text: 'Reported remedies (low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.remedies });
    b.push(rules(cat('remedy').filter((t) => t.rule.subcategory !== 'gemstone')));
  }
  if (o.extras.includes('gemstones')) {
    b.push({ t: 'h3', text: 'Gemstones reported for the Driver number (very low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.gemstones });
    b.push(rules(cat('remedy').filter((t) => t.rule.subcategory === 'gemstone')));
  }
  if (o.extras.includes('cycle')) {
    b.push({ t: 'h3', text: 'Personal year cycle (very low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.cycle });
    b.push({ t: 'p', text: `Personal Year for ${report.cycle.year}: ${report.cycle.personalYear.value} (${report.cycle.personalYear.steps.join(' → ')}).` });
    b.push(rules(cat('cycle')));
    b.push({ t: 'p', style: 'note', text: 'Very low confidence: personal month = personal year + calendar month, reduced (formula agrees across summaries); no meanings per number were found, so none are given.' });
    b.push({ t: 'table', head: ['Month', 'Personal month', 'Working'], rows: personalMonths(report.cycle.personalYear).map((m) => [String(m.month), String(m.value), m.steps.join(' → ')]) });
    const yg = yearGrid(report.analysis, report.cycle.year);
    b.push({ t: 'p', style: 'note', text: 'Very low confidence: the yearly grid method is described only vaguely in one search summary (birth date digits combined with the digits of the year). This is descriptive arithmetic; no forecast is made.' });
    b.push({ t: 'p', text: `Year grid ${yg.year}: adds the digits ${yg.addedDigits.join(', ') || 'none'} to the raw date digits. Newly complete lines: ${yg.newlyComplete.length ? yg.newlyComplete.map((id) => id.slice(2).split('').join('–')).join(', ') : 'none'}. Newly non-empty lines: ${yg.newlyNonEmpty.length ? yg.newlyNonEmpty.map((id) => id.slice(2).split('').join('–')).join(', ') : 'none'}.` });
  }
  if (o.extras.includes('name') && report.nameNumbers) {
    const n = report.nameNumbers;
    b.push({ t: 'h3', text: 'Name numbers (very low confidence)' });
    b.push({ t: 'p', style: 'note', text: RIDERS.name });
    b.push({ t: 'p', text: `Expression ${n.expression.chain.join(' → ')}${n.soulUrge ? `; Soul Urge ${n.soulUrge.chain.join(' → ')}` : ''}${n.personality ? `; Personality ${n.personality.chain.join(' → ')}` : ''}.` });
    b.push(rules(cat('name')));
  }
  const second = o.compareText.trim() ? parseDob(o.compareText) : null;
  if (second && second.ok) {
    const other = analyse(second.dob, 'dob-only');
    const c = compareAnalyses(analyse(a.dob, 'dob-only'), other);
    const l = (ds: number[]) => ds.join(', ') || '-';
    b.push({ t: 'h3', text: `Comparison with ${other.dob.normalised} (descriptive arithmetic only)` });
    b.push({ t: 'p', style: 'note', text: 'No compatibility verdict is made; friend/enemy tables differ between sources and could not be verified.' });
    b.push({ t: 'p', text: `Present in both: ${l(c.both)}. Only in ${a.dob.normalised}: ${l(c.onlyA)}. Only in ${other.dob.normalised}: ${l(c.onlyB)}. Missing from both: ${l(c.neither)}.` });
  }

  b.push({ t: 'h2', text: '7. Evidence and limitations' });
  b.push({
    t: 'ul',
    items: [
      `Mathematical verification: ${passed === checks.length ? 'Calculation verified' : 'Check failed'} (${passed}/${checks.length} checks). Arithmetic only.`,
      'Scientific evidence: every reading is a traditional interpretation without established scientific validation. The closest empirical test found (Genovese, 2017, per a search summary) reported no link between birth numbers and Nobel Prize winners and does not test Lo Shu grids.',
      'Source fidelity: wording is paraphrased from summaries of several web sources; no source page was opened, so it has not been compared with the source texts.',
      'Perceived fit: a reading can feel accurate for reasons unrelated to validity (the Barnum or Forer effect).',
      'Do not use for medical, financial, legal or relationship decisions.',
    ],
  });

  b.push({ t: 'h2', text: '8. Sources cited by the rules above' });
  const ids = [...new Set(triggered.flatMap((t) => t.rule.sourceIds))];
  b.push({
    t: 'ul',
    items: ids.flatMap((id) => {
      const s = getSource(id);
      return s ? [`${s.title}: ${s.url} (${s.accessMethod === 'search-summary-only' ? 'page not read; search summary only' : s.accessMethod})`] : [];
    }),
  });
  return b;
}
