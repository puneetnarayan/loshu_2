import { EVIDENCE_LABELS, FIDELITY_LABELS } from '../data/schema';
import { getSource } from '../data/sources';
import { LINE_NAMES, DIGIT_PLANETS } from '../data/rules';
import { GRID_LAYOUT, lineLabel } from '../loshu';
import type { Report } from '../loshu';

const STATE_TEXT = { complete: 'Complete', partial: 'Partial', empty: 'Empty' } as const;
const STATUS_TEXT = { missing: 'Missing', present: 'Present', repeated: 'Repeated' } as const;

/**
 * Full report used for the PDF. It is only mounted while the browser is printing
 * (see App), so it never duplicates content on screen. All text is rendered as plain text.
 */
export function PrintReport({ report, name, planetary }: { report: Report; name: string; planetary: boolean }) {
  const { analysis: a, triggered, synthesis, checks } = report;
  const sourceIds = [...new Set(triggered.flatMap((t) => t.rule.sourceIds))];
  const passed = checks.filter((c) => c.passed).length;
  const generated = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <article className="print-report" aria-label="Printable report">
      <h1>Lo Shu Grid report</h1>
      <p>
        {name.trim() ? <>Prepared for <strong>{name.trim()}</strong> · </> : null}Date of birth <strong>{a.dob.normalised}</strong> · Mode: {a.mode.label} · Generated {generated}
      </p>
      <p className="note">
        Calculated locally in the browser. The name and date are not stored or transmitted. Traditional readings are not scientifically validated and are not advice.
      </p>

      <h2>1. Grid</h2>
      <table>
        <caption>Fixed Lo Shu layout; counts show the selected mode (raw DOB digits + overlay)</caption>
        <tbody>
          {GRID_LAYOUT.map((row, i) => (
            <tr key={i}>
              {row.map((d) => {
                const s = a.digits.find((x) => x.digit === d)!;
                return (
                  <td key={d} className="grid-cell">
                    <strong>{d}</strong>
                    <br />×{s.combinedCount} · {STATUS_TEXT[s.effectiveStatus]}
                    <br />
                    <span className="small">raw {s.rawCount} + overlay {s.overlayCount}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <h2>2. Calculation audit</h2>
      <table>
        <tbody>
          <tr><th scope="row">Original input / normalised</th><td>{a.audit.originalInput} / {a.audit.normalisedDate}</td></tr>
          <tr><th scope="row">All digits (DDMMYYYY)</th><td>{a.audit.allDigits.join(', ')}</td></tr>
          <tr><th scope="row">Zeros excluded</th><td>{a.audit.zerosExcluded}</td></tr>
          <tr><th scope="row">Non-zero digits</th><td>{a.audit.nonZeroDigits.join(', ')}</td></tr>
          <tr><th scope="row">Present / missing / repeated (raw)</th><td>{a.audit.presentSet.join(', ') || 'none'} / {a.audit.missingSet.join(', ') || 'none'} / {a.audit.repeatedSet.join(', ') || 'none'}</td></tr>
          <tr><th scope="row">Driver (Moolank)</th><td>{a.driver.value}: {a.driver.steps.join(' → ')}</td></tr>
          <tr><th scope="row">Destiny (Bhagyank)</th><td>{a.destiny.value}: {a.destiny.steps.join(' → ')}</td></tr>
          <tr><th scope="row">Kua</th><td>Unavailable (conventions could not be verified)</td></tr>
          <tr><th scope="row">Arithmetic checks</th><td>{passed}/{checks.length} passed</td></tr>
        </tbody>
      </table>
      <table>
        <caption>Frequency table</caption>
        <thead><tr><th>Digit</th><th>Cell</th><th>Raw</th><th>Overlay</th><th>Total</th><th>Status in mode</th>{planetary && <th>Planet</th>}</tr></thead>
        <tbody>
          {a.digits.map((s) => (
            <tr key={s.digit}>
              <td>{s.digit}</td><td>{s.position.label}</td><td>{s.rawCount}</td><td>{s.overlayCount}</td><td>{s.combinedCount}</td><td>{STATUS_TEXT[s.effectiveStatus]}</td>
              {planetary && <td>{DIGIT_PLANETS[s.digit]}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <h2>3. The eight lines</h2>
      <table>
        <thead><tr><th>Line</th><th>Type</th><th>Present</th><th>Missing</th><th>State</th><th>Traditional name</th></tr></thead>
        <tbody>
          {a.lines.map((l) => (
            <tr key={l.def.id}>
              <td>{lineLabel(l.def)}</td><td>{l.def.kind}</td><td>{l.presentDigits.join(', ') || '—'}</td><td>{l.missingDigits.join(', ') || '—'}</td><td>{STATE_TEXT[l.state]}</td><td>{LINE_NAMES[l.def.id]?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>4. Interpretation (rule-based)</h2>
      {synthesis.summary.map((s) => <p key={s}>{s}</p>)}
      <h3>Primary patterns</h3>
      <RuleList items={synthesis.primary} />
      <h3>Secondary patterns</h3>
      <RuleList items={synthesis.secondary} />
      {synthesis.conflicts.length > 0 && (
        <>
          <h3>Themes on both sides</h3>
          <ul>{synthesis.conflicts.map((g) => <li key={g.theme}>{g.explanation}</li>)}</ul>
        </>
      )}
      <h3>Not covered by any documented rule</h3>
      <ul>{synthesis.unsupported.map((u) => <li key={u.subject}><strong>{u.subject}:</strong> {u.reason}</li>)}</ul>

      <h2>5. Evidence and limitations</h2>
      <ul>
        <li><strong>Mathematical verification:</strong> {passed === checks.length ? 'Calculation verified' : 'Check failed'} ({passed}/{checks.length} checks). Arithmetic only.</li>
        <li><strong>Scientific evidence:</strong> every reading is a traditional interpretation without established scientific validation. The closest empirical test found (Genovese, 2017, per a search summary) reported no link between birth numbers and Nobel Prize winners and does not test Lo Shu grids.</li>
        <li><strong>Source fidelity:</strong> wording is paraphrased from summaries of several web sources; no source page was opened, so it has not been compared with the source texts.</li>
        <li><strong>Perceived fit:</strong> a reading can feel accurate for reasons unrelated to validity (the Barnum or Forer effect).</li>
        <li>Do not use for medical, financial, legal or relationship decisions.</li>
      </ul>

      <h2>6. Sources cited by the rules above</h2>
      <ul>
        {sourceIds.map((id) => {
          const s = getSource(id);
          return s ? (
            <li key={id}>
              {s.title}: {s.url} <span className="small">({s.accessMethod === 'search-summary-only' ? 'page not read; search summary only' : s.accessMethod})</span>
            </li>
          ) : null;
        })}
      </ul>
    </article>
  );
}

function RuleList({ items }: { items: Report['triggered'] }) {
  if (items.length === 0) return <p>None.</p>;
  return (
    <ul>
      {items.map((t) => (
        <li key={t.rule.id}>
          <strong>{t.rule.title}</strong> [{t.rule.id}]: {t.rule.advancedText}{' '}
          <span className="small">
            ({EVIDENCE_LABELS[t.rule.evidenceClassification].short}; {FIDELITY_LABELS[t.rule.sourceFidelityStatus].short})
          </span>
        </li>
      ))}
    </ul>
  );
}
