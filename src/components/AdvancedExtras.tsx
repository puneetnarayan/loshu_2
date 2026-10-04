import { useMemo } from 'react';
import { DIGIT_PLANETS, LINE_NAMES } from '../data/rules';
import { FREQUENCY_RANGE, patternFrequencies } from '../lookup';
import { analyse, compareAnalyses, ELEMENT_DIGITS, lineLabel, parseDob, planetProfile } from '../loshu';
import type { Digit, Report } from '../loshu';
import { EvidenceLabel, RuleDerivation, Rider, Section, StatusTag, TableWrap } from './shared';

function RuleBlocks({ items }: { items: Report['triggered'] }) {
  if (items.length === 0) return <p className="muted">No documented rule applies.</p>;
  return (
    <ul className="plain">
      {items.map((t) => (
        <li key={t.rule.id}>
          <strong>{t.rule.title}</strong> <code>{t.rule.id}</code>
          <br />
          {t.rule.advancedText}
          <EvidenceLabel rule={t.rule} />
          <RuleDerivation rule={t.rule} why={t.why} />
        </li>
      ))}
    </ul>
  );
}

const by = (report: Report, ...cats: string[]) => report.triggered.filter((t) => cats.includes(t.rule.category));

export function KeyNumbersSection({ report }: { report: Report }) {
  const a = report.analysis;
  return (
    <Section title="Driver and Destiny readings">
      <p>
        Driver <strong>{a.driver.value}</strong> ({a.driver.steps.join(' → ')}) and Destiny <strong>{a.destiny.value}</strong> ({a.destiny.steps.join(' → ')}). They are{' '}
        {a.driver.value === a.destiny.value ? 'the same number' : 'different numbers'}. These readings use the raw date and are shown whatever overlay mode is selected.
      </p>
      <Rider level="low">
        One-line meanings come from a single search summary of several guides and are paraphrased. Destiny wording for 6 and 7 was not visible and extends the Lo Shu keywords. Friend/enemy compatibility tables for Driver and Destiny exist but only part of one was visible and sources differ, so no compatibility verdict is made.
      </Rider>
      <RuleBlocks items={by(report, 'driver', 'destiny')} />
    </Section>
  );
}

export function FrequencySection({ report }: { report: Report }) {
  const items = patternFrequencies(report.analysis);
  return (
    <Section title="How common is this pattern?">
      <p>
        Share of all {FREQUENCY_RANGE.dates.toLocaleString('en-GB')} calendar dates from {FREQUENCY_RANGE.from} to {FREQUENCY_RANGE.to} (each date counted once, not weighted by births) that show the same pattern in the same mode ({report.analysis.mode.label}). Computed by this app’s own engine; regenerated and checked by an automated test.
      </p>
      <TableWrap>
        <table className="table">
          <thead>
            <tr><th scope="col">Pattern in this reading</th><th scope="col">Share of dates</th><th scope="col"> </th></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.key}>
                <th scope="row">{i.label}</th>
                <td>{i.percent.toFixed(2)}%</td>
                <td><span className="bar" style={{ width: `${Math.max(2, Math.min(100, i.percent))}px` }} aria-hidden="true" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <p className="muted small">A common pattern is not special, and a rare one is not meaningful in itself. This is arithmetic about calendars, not about people.</p>
    </Section>
  );
}

export function FactsSection({ report }: { report: Report }) {
  const a = report.analysis;
  const names = (ids: string[]) => ids.map((id) => lineLabel(a.lines.find((l) => l.def.id === id)!.def)).join(', ');
  return (
    <Section title="Grid facts and line weights">
      <ul>
        <li>Centre (5): {a.facts.centreCount === 0 ? 'empty' : `filled ×${a.facts.centreCount}`}.</li>
        <li>Cells with at least one digit: {a.facts.activeCells} of 9. Total digits counted in this mode: {a.facts.totalCount}.</li>
        <li>Heaviest line(s) by total digit count: {names(a.facts.heaviestLineIds)}. Lightest: {names(a.facts.lightestLineIds)}.</li>
      </ul>
      <TableWrap>
        <table className="table">
          <caption>Line weight = sum of the counts of its three digits (selected mode)</caption>
          <thead><tr><th scope="col">Line</th><th scope="col">Name</th><th scope="col">Weight</th><th scope="col">State</th></tr></thead>
          <tbody>
            {a.lines.map((l) => (
              <tr key={l.def.id}>
                <th scope="row">{lineLabel(l.def)}</th>
                <td>{LINE_NAMES[l.def.id]?.name}</td>
                <td>{l.weight} <span className="bar" style={{ width: `${l.weight * 12}px` }} aria-hidden="true" /></td>
                <td>{l.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <p className="muted small">Weights are arithmetic. No tradition source was found that reads heavy or light lines, so no meaning is attached to them.</p>
    </Section>
  );
}

export function PlanetSection({ report }: { report: Report }) {
  const profile = useMemo(() => planetProfile(report.analysis, DIGIT_PLANETS), [report.analysis]);
  return (
    <Section title="Planetary profile (optional)">
      <Rider level="low">
        The digit-to-planet mapping was confirmed by several search summaries (Indian scheme; one lists 4 as Uranus/Rahu). The planet themes are short general keywords, partly from background knowledge, and are not verified against a primary text.
      </Rider>
      <TableWrap>
        <table className="table">
          <thead><tr><th scope="col">Planet</th><th scope="col">Digit</th><th scope="col">Count</th><th scope="col">Status</th></tr></thead>
          <tbody>
            {profile.rows.map((r) => (
              <tr key={r.digit}><th scope="row">{r.planet}</th><td>{r.digit}</td><td>{r.count}</td><td><StatusTag status={r.status} /></td></tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <p>Most repeated: {profile.dominant.join(', ') || 'none repeated'}. Not represented: {profile.absent.join(', ') || 'none'}.</p>
      <RuleBlocks items={by(report, 'planet-profile', 'planetary')} />
    </Section>
  );
}

export function ElementSection({ report }: { report: Report }) {
  const el = report.analysis.elements;
  return (
    <Section title="Five elements (optional)">
      <Rider level="low">
        The element of each number (1 water; 2, 5, 8 earth; 3, 4 wood; 6, 7 metal; 9 fire) was confirmed by several search summaries and comes from Feng Shui / Nine Star Ki, a different tradition from Indian Lo Shu numerology. The element themes are general keywords from background knowledge and were not verified.
      </Rider>
      <TableWrap>
        <table className="table">
          <thead><tr><th scope="col">Element</th><th scope="col">Digits</th><th scope="col">Total count</th><th scope="col">Present digits</th></tr></thead>
          <tbody>
            {el.rows.map((r) => (
              <tr key={r.element}><th scope="row">{r.element}</th><td>{ELEMENT_DIGITS[r.element].join(', ')}</td><td>{r.count}</td><td>{r.presentDigits.join(', ') || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <p>Most represented: {el.dominant.join(', ') || 'none'}. Not represented: {el.absent.join(', ') || 'none'}. Earth owns three digits, so totals favour it.</p>
      <RuleBlocks items={by(report, 'element')} />
    </Section>
  );
}

export function RemedySection({ report }: { report: Report }) {
  const a = report.analysis;
  const rem = by(report, 'remedy');
  const uncovered = a.effective.repeated.filter((d) => !rem.some((t) => t.rule.id === `REM-${d}-REPEATED`));
  return (
    <Section title="Reported remedies (optional)">
      <Rider level="low">
        Remedies were collected from search summaries of commercial guides. There is no evidence that any traditional remedy changes anything, and none is promised to. Practical habits are ordinary self-improvement ideas. Traditional items (colours, mantras, charity, objects) are optional, some involve spending money or religious practice, and gemstone advice is deliberately left out.
      </Rider>
      <RuleBlocks items={rem} />
      {uncovered.length > 0 && <p className="muted">No remedy was documented for repeated {uncovered.join(', ')}.</p>}
      <p className="muted small">Do not use remedies in place of medical, financial or legal advice.</p>
    </Section>
  );
}

export function CycleSection({ report }: { report: Report }) {
  const c = report.cycle;
  return (
    <Section title="Personal year cycle (optional, forecast style)">
      <Rider level="very-low">
        Forecast-style reading from Western numerology, not part of the Lo Shu tradition. The formula agrees across summaries but the meanings are generic and unvalidated, and no source text was read. Use it, if at all, as a prompt for planning.
      </Rider>
      <p>
        Personal Year for {c.year}: <strong>{c.personalYear.value}</strong> ({c.personalYear.steps.join(' → ')}). Calendar-year convention; as of the date this page was opened.
      </p>
      <RuleBlocks items={by(report, 'cycle')} />
    </Section>
  );
}

export function NameSection({ report }: { report: Report }) {
  const n = report.nameNumbers;
  const row = (label: string, x: NonNullable<typeof n>['expression'] | null) =>
    x ? (
      <tr key={label}>
        <th scope="row">{label}</th>
        <td>{x.letters.map((l) => `${l.letter}${l.value}`).join(' ')}</td>
        <td>{x.chain.join(' → ')}</td>
        <td>{x.value}</td>
      </tr>
    ) : (
      <tr key={label}><th scope="row">{label}</th><td colSpan={3}>No such letters in this name.</td></tr>
    );
  return (
    <Section title="Name numbers (optional, Pythagorean)">
      <Rider level="very-low">
        A separate system from the Lo Shu grid. The letter table and the three-number method agree across summaries, but no source text was read, schools differ on Y, master numbers and which name to use, and the readings below only reuse the Lo Shu keywords for each digit. The name never changes the grid.
      </Rider>
      {!n ? (
        <p className="muted">Enter a name using the letters A–Z to see these numbers.</p>
      ) : (
        <>
          <TableWrap>
            <table className="table">
              <caption>Letters A J S = 1 … I R = 9. Vowels A, E, I, O, U; Y is treated as a consonant.</caption>
              <thead><tr><th scope="col">Number</th><th scope="col">Letter values</th><th scope="col">Reduction</th><th scope="col">Result</th></tr></thead>
              <tbody>
                {row('Expression (all letters)', n.expression)}
                {row('Soul Urge (vowels)', n.soulUrge)}
                {row('Personality (consonants)', n.personality)}
              </tbody>
            </table>
          </TableWrap>
          <p className="muted small">The reduction shows the intermediate total, so a pass through 11, 22 or 33 stays visible even though the result is reduced to one digit.{n.ignored.length ? ` Ignored characters: ${n.ignored.join(' ')}.` : ''}</p>
          <RuleBlocks items={by(report, 'name')} />
        </>
      )}
    </Section>
  );
}

interface CompareProps {
  report: Report;
  text: string;
  onText: (v: string) => void;
}
export function CompareSection({ report, text, onText }: CompareProps) {
  const parsed = useMemo(() => (text.trim() === '' ? null : parseDob(text)), [text]);
  const other = parsed && parsed.ok ? analyse(parsed.dob, 'dob-only') : null;
  const mine = useMemo(() => analyse(report.analysis.dob, 'dob-only'), [report.analysis.dob]);
  const cmp = other ? compareAnalyses(mine, other) : null;
  const list = (ds: Digit[]) => ds.join(', ') || '—';
  return (
    <Section title="Compare with another date (optional)">
      <Rider level="moderate">
        Descriptive arithmetic only: which digits and lines the two dates share. No compatibility verdict is made, because friend/enemy tables differ between sources and could not be verified. Both dates use the raw date digits.
      </Rider>
      <div className="field">
        <label htmlFor="compare-dob">Second date of birth (DD-MM-YYYY)</label>
        <input id="compare-dob" type="text" inputMode="numeric" autoComplete="off" maxLength={10} placeholder="DD-MM-YYYY" value={text} onChange={(e) => onText(e.target.value)} aria-invalid={parsed && !parsed.ok && text.length >= 10 ? true : undefined} />
        {parsed && !parsed.ok && text.trim().length >= 10 && <p className="error" role="alert">{parsed.error}</p>}
      </div>
      {cmp && other && (
        <>
          <ul>
            <li>Present in both: {list(cmp.both)}.</li>
            <li>Only in {mine.dob.normalised}: {list(cmp.onlyA)}.</li>
            <li>Only in {other.dob.normalised}: {list(cmp.onlyB)}.</li>
            <li>Missing from both: {list(cmp.neither)}.</li>
            <li>Driver: {mine.driver.value} and {other.driver.value} ({cmp.sameDriver ? 'same' : 'different'}). Destiny: {mine.destiny.value} and {other.destiny.value} ({cmp.sameDestiny ? 'same' : 'different'}).</li>
          </ul>
          <TableWrap>
            <table className="table">
              <thead><tr><th scope="col">Line</th><th scope="col">{mine.dob.normalised}</th><th scope="col">{other.dob.normalised}</th></tr></thead>
              <tbody>{cmp.lines.map((l) => <tr key={l.id}><th scope="row">{l.label}</th><td>{l.a}</td><td>{l.b}</td></tr>)}</tbody>
            </table>
          </TableWrap>
        </>
      )}
    </Section>
  );
}
