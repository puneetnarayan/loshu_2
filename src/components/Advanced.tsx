import { useMemo } from 'react';
import { DIGIT_PLANETS, LINE_NAMES } from '../data/rules';
import { EVIDENCE_LABELS, FIDELITY_LABELS } from '../data/schema';
import { digitRule, ruleById } from '../lookup';
import { DIGITS, OVERLAY_MODES, buildReport, lineLabel } from '../loshu';
import type { Digit, OverlayModeId, Report } from '../loshu';
import { CellDetail, GridView } from './GridView';
import type { GridLayer } from './GridView';
import { Derivation, EvidenceLabel, RuleDerivation, RuleRecord, Section, StatusTag, TableWrap, VerificationBadge } from './shared';

interface Props {
  report: Report;
  mode: OverlayModeId;
  onMode: (m: OverlayModeId) => void;
  layer: GridLayer;
  onLayer: (l: GridLayer) => void;
  planetary: boolean;
  onPlanetary: (b: boolean) => void;
  selected: Digit | null;
  onSelect: (d: Digit) => void;
}

const LINE_STATE_TEXT = { complete: '✓ Complete', partial: '◐ Partial', empty: '○ Empty' } as const;
const KIND_TITLE = { horizontal: 'Horizontal planes (rows)', vertical: 'Vertical planes (columns)', diagonal: 'Diagonals' } as const;

export function Advanced(p: Props) {
  const { report, mode, layer, planetary } = p;
  const { analysis: a, triggered, synthesis, checks } = report;
  const baseline = useMemo(() => buildReport(a.dob, 'dob-only', { planetary }), [a.dob, planetary]);
  const baseIds = new Set(baseline.triggered.map((t) => t.rule.id));
  const nowIds = new Set(triggered.map((t) => t.rule.id));
  const gained = [...nowIds].filter((i) => !baseIds.has(i));
  const lost = [...baseIds].filter((i) => !nowIds.has(i));
  const changedDigits = a.digits.filter((d) => d.overlayChangedStatus);
  const modeDef = a.mode;

  const fidelityCounts = new Map<string, number>();
  const evidenceCounts = new Map<string, number>();
  for (const t of triggered) {
    fidelityCounts.set(t.rule.sourceFidelityStatus, (fidelityCounts.get(t.rule.sourceFidelityStatus) ?? 0) + 1);
    evidenceCounts.set(t.rule.evidenceClassification, (evidenceCounts.get(t.rule.evidenceClassification) ?? 0) + 1);
  }

  return (
    <div id="panel-advanced" role="tabpanel" aria-labelledby="tab-advanced" tabIndex={0} className="tabpanel">
      <VerificationBadge analysis={a} checks={checks} />

      <Section title="Overlay mode and view controls">
        <fieldset className="modes">
          <legend>Overlay mode (adds numbers to a separate layer; the raw DOB grid is never altered)</legend>
          {OVERLAY_MODES.map((m) => (
            <label key={m.id} className={`mode${m.available ? '' : ' mode-off'}`}>
              <input type="radio" name="mode" value={m.id} checked={mode === m.id} disabled={!m.available} onChange={() => p.onMode(m.id)} />
              <span>
                <strong>{m.label}</strong>
                <br />
                <span className="muted small">{m.available ? m.description : m.unavailableReason}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <fieldset className="modes inline">
          <legend>Grid view</legend>
          {(['raw', 'overlay', 'combined'] as const).map((l) => (
            <label key={l}>
              <input type="radio" name="layer" value={l} checked={layer === l} onChange={() => p.onLayer(l)} /> {l === 'raw' ? 'Raw DOB' : l === 'overlay' ? 'Overlay only' : 'Combined'}
            </label>
          ))}
        </fieldset>
        <label className="check">
          <input type="checkbox" checked={planetary} onChange={(e) => p.onPlanetary(e.target.checked)} /> Show optional planetary associations (Indian scheme; mapping not verified against a primary text)
        </label>
        <div className="mode-effect">
          <p><strong>Selected: {modeDef.label}.</strong> {modeDef.description}</p>
          <ul>
            <li>Numbers added: {modeDef.addsDriver || modeDef.addsDestiny ? [modeDef.addsDriver && `Driver ${a.driver.value}`, modeDef.addsDestiny && `Destiny ${a.destiny.value}`].filter(Boolean).join(', ') : 'none'}.</li>
            <li>Digit statuses changed by the overlay: {changedDigits.length ? changedDigits.map((d) => `${d.digit} (${d.rawStatus} → ${d.effectiveStatus})`).join(', ') : 'none'}.</li>
            <li>Interpretation rules gained versus DOB-only: {gained.length ? gained.join(', ') : 'none'}. Lost: {lost.length ? lost.join(', ') : 'none'}.</li>
          </ul>
        </div>
      </Section>

      <Section title="Advanced grid">
        <GridView analysis={a} selected={p.selected} onSelect={p.onSelect} variant="advanced" layer={layer} triggered={triggered} />
        <CellDetail digit={p.selected} analysis={a} triggered={triggered} variant="advanced" />
      </Section>

      <Section title="Calculation audit">
        <TableWrap><table className="table">
          <caption>Raw DOB layer (never changed by overlays)</caption>
          <tbody>
            <tr><th scope="row">Original input</th><td><code>{a.audit.originalInput}</code></td></tr>
            <tr><th scope="row">Normalised date</th><td><code>{a.audit.normalisedDate}</code> (DD-MM-YYYY)</td></tr>
            <tr><th scope="row">Full digit sequence</th><td>{a.audit.allDigits.join(', ')}</td></tr>
            <tr><th scope="row">Zero digits excluded</th><td>{a.audit.zerosExcluded}</td></tr>
            <tr><th scope="row">Non-zero digits included</th><td>{a.audit.nonZeroDigits.join(', ')} ({a.audit.nonZeroDigits.length})</td></tr>
            <tr><th scope="row">Present set</th><td>{a.audit.presentSet.join(', ') || '∅'}</td></tr>
            <tr><th scope="row">Missing set</th><td>{a.audit.missingSet.join(', ') || '∅'}</td></tr>
            <tr><th scope="row">Repeated set</th><td>{a.audit.repeatedSet.join(', ') || '∅'}</td></tr>
            <tr><th scope="row">Complete lines</th><td>{a.lines.filter((l) => l.rawState === 'complete').map((l) => lineLabel(l.def)).join(', ') || 'none'}</td></tr>
            <tr><th scope="row">Entirely empty lines</th><td>{a.lines.filter((l) => l.rawState === 'empty').map((l) => lineLabel(l.def)).join(', ') || 'none'}</td></tr>
          </tbody>
        </table></TableWrap>
        <TableWrap><table className="table">
          <caption>Optional overlays and conventions</caption>
          <tbody>
            <tr>
              <th scope="row">Driver (Moolank)</th>
              <td><strong>{a.driver.value}</strong>: {a.driver.steps.join(' → ')}.<br /><span className="muted small">{a.driver.formula}</span></td>
            </tr>
            <tr>
              <th scope="row">Destiny (Bhagyank)</th>
              <td><strong>{a.destiny.value}</strong>: {a.destiny.steps.join(' → ')}.<br /><span className="muted small">{a.destiny.formula}</span></td>
            </tr>
            <tr>
              <th scope="row">Kua</th>
              <td>Unavailable. <span className="muted small">{a.kua.reason}</span></td>
            </tr>
            <tr>
              <th scope="row">Triggered rule IDs</th>
              <td>{triggered.map((t) => t.rule.id).join(', ') || 'none'}</td>
            </tr>
          </tbody>
        </table></TableWrap>
        <TableWrap><table className="table">
          <caption>Frequency table, digits 1–9</caption>
          <thead>
            <tr><th scope="col">Digit</th><th scope="col">Cell</th><th scope="col">Raw</th><th scope="col">Overlay</th><th scope="col">Total</th><th scope="col">Raw status</th><th scope="col">Status in mode</th><th scope="col">Changed by overlay</th></tr>
          </thead>
          <tbody>
            {a.digits.map((s) => (
              <tr key={s.digit}>
                <th scope="row">{s.digit}</th>
                <td>{s.position.label}</td>
                <td>{s.rawCount}</td>
                <td>{s.overlayCount}{s.overlaySources.length ? ` (${s.overlaySources.join(' + ')})` : ''}</td>
                <td>{s.combinedCount}</td>
                <td><StatusTag status={s.rawStatus} /></td>
                <td><StatusTag status={s.effectiveStatus} /></td>
                <td>{s.overlayChangedStatus ? 'yes' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table></TableWrap>
      </Section>

      <Section title="Individual number analysis">
        {DIGITS.map((d) => {
          const stat = a.digits.find((s) => s.digit === d)!;
          const kinds = [['PRESENT', 'Present (1 or more)'], ['REPEATED', 'Repeated (2 or more)'], ['MISSING', 'Missing (0)']] as const;
          const present = digitRule(d, 'PRESENT');
          const applies = (k: string) => nowIds.has(`NUM-${d}-${k}`);
          return (
            <details key={d} className="number-detail">
              <summary>
                <strong>{d}</strong> · {stat.position.label} · raw {stat.rawCount}, overlay {stat.overlayCount}, total {stat.combinedCount} · <StatusTag status={stat.effectiveStatus} />
              </summary>
              {kinds.map(([k, label]) => {
                const r = digitRule(d, k);
                return (
                  <div key={k} className={`rule-block${applies(k) ? ' applies' : ''}`}>
                    <p><strong>{label}</strong>{applies(k) ? ' — applies in the selected mode' : ' — does not apply'}</p>
                    <p>{r.advancedText}</p>
                  </div>
                );
              })}
              <dl className="record">
                <dt>Constructive expression</dt><dd>{present.constructiveExpression}</dd>
                <dt>Potential excess or challenge</dt><dd>{present.potentialChallenge}</dd>
                <dt>Practical reflection</dt><dd>{present.reflectionSuggestion}</dd>
                <dt>Planetary association (optional)</dt><dd>{planetary ? `${DIGIT_PLANETS[d]} (Indian scheme)` : 'Hidden. Enable the planetary option above.'}</dd>
                <dt>Source and attribution</dt><dd>{present.sourceIds.join(', ')} (details in the rule record below)</dd>
                <dt>Conflicting interpretations</dt><dd>{[...present.knownDisagreements, ...digitRule(d, 'REPEATED').knownDisagreements, ...digitRule(d, 'MISSING').knownDisagreements].join(' ')}</dd>
              </dl>
              <EvidenceLabel rule={present} />
              <details className="derive"><summary>Full rule records</summary>
                {kinds.map(([k]) => <RuleRecord key={k} rule={digitRule(d, k)} />)}
              </details>
            </details>
          );
        })}
      </Section>

      <Section title="All eight geometric lines">
        <p className="muted small">Membership is geometric: exactly three rows, three columns and two diagonals of the fixed grid. Names come from popular online calculators; sources differ (see disagreements).</p>
        <div>
          <TableWrap><table className="table">
            <caption>Line analysis in the selected mode</caption>
            <thead>
              <tr><th scope="col">Line</th><th scope="col">Type</th><th scope="col">Positions</th><th scope="col">Present</th><th scope="col">Missing</th><th scope="col">State</th><th scope="col">Raw state</th><th scope="col">Name(s)</th><th scope="col">Rules</th></tr>
            </thead>
            <tbody>
              {a.lines.map((l) => {
                const nm = LINE_NAMES[l.def.id];
                const ids = triggered.filter((t) => t.rule.requiredLines.some((x) => x.lineId === l.def.id)).map((t) => t.rule.id);
                return (
                  <tr key={l.def.id}>
                    <th scope="row">{lineLabel(l.def)}</th>
                    <td>{l.def.kind}</td>
                    <td>{l.positions.map((x) => x.label).join(' → ')}</td>
                    <td>{l.presentDigits.join(', ') || '—'}</td>
                    <td>{l.missingDigits.join(', ') || '—'}</td>
                    <td>{LINE_STATE_TEXT[l.state]}</td>
                    <td>{LINE_STATE_TEXT[l.rawState]}</td>
                    <td>{nm?.name}{nm?.alt ? ` / ${nm.alt}` : ''}</td>
                    <td>{ids.join(', ') || 'no rule (partial lines have no documented reading)'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></TableWrap>
        </div>
      </Section>

      <Section title="Planes and directional groupings">
        {(['horizontal', 'vertical', 'diagonal'] as const).map((kind) => (
          <div key={kind}>
            <h4>{KIND_TITLE[kind]}</h4>
            {a.lines.filter((l) => l.def.kind === kind).map((l) => {
              const cr = ruleById(`LINE-${l.def.id}-COMPLETE`)!;
              const er = ruleById(`LINE-${l.def.id}-EMPTY`)!;
              return (
                <details key={l.def.id} className="derive">
                  <summary>
                    {lineLabel(l.def)} · {LINE_NAMES[l.def.id]?.name} · {LINE_STATE_TEXT[l.state]}
                  </summary>
                  <p>Digits {l.def.digits.join(', ')} at {l.positions.map((x) => x.label).join(', ')}. Condition for complete: all three counts ≥ 1. Condition for empty: all three counts = 0. Current: {l.presentDigits.length} of 3 present.</p>
                  <p>{cr.advancedText}</p>
                  <p>{er.advancedText}</p>
                  <p><strong>Alternative namings / disagreements:</strong> {cr.knownDisagreements.join(' ')}</p>
                  <p className="muted small">Line naming here follows one popular convention; it is not mixed with other conventions.</p>
                </details>
              );
            })}
          </div>
        ))}
      </Section>

      <Section title="Interpretation synthesis">
        {synthesis.summary.map((s) => <p key={s}>{s}</p>)}
        <h4>Primary patterns</h4>
        <TriggeredList items={synthesis.primary} />
        <h4>Secondary patterns</h4>
        <TriggeredList items={synthesis.secondary} />
        <h4>Reinforcing themes</h4>
        {synthesis.reinforcing.length ? <ul>{synthesis.reinforcing.map((g) => <li key={g.theme}><strong>{g.theme}</strong>: {g.explanation}</li>)}</ul> : <p>None.</p>}
        <h4>Themes on both sides</h4>
        {synthesis.conflicts.length ? <ul>{synthesis.conflicts.map((g) => <li key={g.theme}><strong>{g.theme}</strong>: {g.explanation}</li>)}</ul> : <p>None.</p>}
        <p className="muted small">Theme tags are project-assigned grouping labels for this synthesis step, not claims made by any source.</p>
        <h4>Unsupported or unavailable interpretations</h4>
        <ul>{synthesis.unsupported.map((u) => <li key={u.subject}><strong>{u.subject}</strong>: {u.reason}</li>)}</ul>
        {synthesis.duplicatesRemoved.length > 0 && <p>Duplicates merged: {synthesis.duplicatesRemoved.map((d) => `${d.removed} → ${d.keptAs}`).join(', ')}.</p>}
        <Derivation title="Audit record">
          <TableWrap><table className="table">
            <thead><tr><th scope="col">Rule</th><th scope="col">Tier</th><th scope="col">Included</th><th scope="col">Why</th></tr></thead>
            <tbody>
              {synthesis.audit.map((e) => (
                <tr key={e.ruleId}><th scope="row">{e.ruleId}</th><td>{e.tier}</td><td>{e.included ? 'yes' : 'no'}</td><td>{e.why.join(' ') || e.note}</td></tr>
              ))}
            </tbody>
          </table></TableWrap>
        </Derivation>
      </Section>

      <Section title="Evidence and confidence">
        <p>Four separate questions are never merged into one score, and no accuracy percentage is given.</p>
        <dl className="record">
          <dt>1. Mathematical verification</dt>
          <dd>{checks.every((c) => c.passed) ? 'Calculation verified' : 'Check failed'}: {checks.filter((c) => c.passed).length}/{checks.length} runtime checks passed for this input. The automated test suite covers date validation, digit counts, lines and overlays.</dd>
          <dt>2. Source fidelity (triggered rules)</dt>
          <dd>{[...fidelityCounts.entries()].map(([k, n]) => `${n} × ${FIDELITY_LABELS[k as keyof typeof FIDELITY_LABELS].short}`).join('; ') || 'No rules triggered'}. These are counts of rules, not a probability.</dd>
          <dt>3. Scientific evidence (triggered rules)</dt>
          <dd>{[...evidenceCounts.entries()].map(([k, n]) => `${n} × ${EVIDENCE_LABELS[k as keyof typeof EVIDENCE_LABELS].short}`).join('; ') || 'No rules triggered'}.</dd>
          <dt>4. User-perceived fit</dt>
          <dd>Not collected. If it were, it would be reported separately and would not count as evidence of accuracy.</dd>
        </dl>
      </Section>

      <Section title="Rule records">
        {triggered.length === 0 ? <p>No rules triggered.</p> : triggered.map((t) => (
          <details key={t.rule.id} className="derive">
            <summary><code>{t.rule.id}</code> · {t.rule.title}</summary>
            <RuleRecord rule={t.rule} />
          </details>
        ))}
      </Section>
    </div>
  );
}

function TriggeredList({ items }: { items: Report['triggered'] }) {
  if (items.length === 0) return <p>None.</p>;
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
