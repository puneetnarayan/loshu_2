import { useId } from 'react';
import type { ReactNode } from 'react';
import { CONFIDENCE_LABELS, EVIDENCE_LABELS, FIDELITY_LABELS } from '../data/schema';
import type { Confidence } from '../data/schema';
import type { InterpretationRule } from '../data/schema';
import { VALENCE_LEGEND, VALENCE_TAG, valenceOf } from '../data/valence';
import type { Valence } from '../data/valence';
import { resolveSources } from '../lookup';
import type { Analysis, DigitStat } from '../loshu';

export const STATUS_TEXT = {
  missing: { symbol: '○', label: 'Missing' },
  present: { symbol: '✓', label: 'Present' },
  repeated: { symbol: '↻', label: 'Repeated' },
} as const;

export function StatusTag({ status, count }: { status: DigitStat['rawStatus']; count?: number }) {
  const s = STATUS_TEXT[status];
  return (
    <span className={`status status-${status}`}>
      <span aria-hidden="true">{s.symbol}</span> {s.label}
      {count !== undefined && count > 0 ? ` ×${count}` : ''}
    </span>
  );
}

/** Visible warning shown wherever the confidence level is low. Text is plain, never colour-only. */
export function Rider({ level = 'low', children }: { level?: Confidence; children?: ReactNode }) {
  const c = CONFIDENCE_LABELS[level];
  return (
    <aside className={`rider rider-${level}`} role="note">
      <strong>{level === 'moderate' ? 'Note:' : `${c.short}:`}</strong>{' '}
      {children ?? c.rider}
    </aside>
  );
}

/** Visible text tag for a coloured reading, so the meaning never depends on colour alone. */
export function ValenceTag({ v }: { v: Valence }) {
  return <span className={`vtag vtag-${v}`}>{VALENCE_TAG[v]}</span>;
}

export const readingClass = (v: Valence) => `reading reading-${v}`;
export const ruleValence = valenceOf;

export function ColourGuide() {
  return (
    <p className="colour-guide muted small">
      <span className="vtag vtag-positive">Positive</span> <span className="vtag vtag-neutral">Neutral</span> <span className="vtag vtag-negative">Challenge</span> {VALENCE_LEGEND}
    </p>
  );
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer external">
      {children} <span className="ext">(external site, opens in a new tab)</span>
    </a>
  );
}

/** Concise evidence label with an expandable explanation (never a percentage). */
export function EvidenceLabel({ rule }: { rule: InterpretationRule }) {
  const ev = EVIDENCE_LABELS[rule.evidenceClassification];
  const fid = FIDELITY_LABELS[rule.sourceFidelityStatus];
  const conf = CONFIDENCE_LABELS[rule.confidence].short;
  return (
    <details className="evidence">
      <summary>
        <span className="chip">{ev.short}</span>{' '}
        <span className="chip chip-alt">{fid.short}</span>{' '}
        <span className={`chip chip-${rule.confidence}`}>{conf}</span>
      </summary>
      {rule.confidence !== 'moderate' && <Rider level={rule.confidence}>{rule.confidenceReason}</Rider>}
      <p>
        <strong>Scientific evidence:</strong> {ev.explanation}
      </p>
      <p>
        <strong>Source fidelity:</strong> {fid.explanation}
      </p>
      <p>
        <strong>Confidence:</strong> {rule.confidenceReason}
      </p>
      <p>
        <strong>Validation note:</strong> {rule.empiricalValidationStatus}
      </p>
    </details>
  );
}

export function Derivation({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <details className="derive">
      <summary>{title ?? 'How was this derived?'}</summary>
      <div className="derive-body">{children}</div>
    </details>
  );
}

export function RuleDerivation({ rule, why }: { rule: InterpretationRule; why: string[] }) {
  return (
    <Derivation>
      <ol>
        {why.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ol>
      <p>{rule.calculationExplanation}</p>
      <p className="muted">
        Rule <code>{rule.id}</code> · {rule.school}
      </p>
    </Derivation>
  );
}

export function RuleRecord({ rule }: { rule: InterpretationRule }) {
  const srcs = resolveSources(rule);
  return (
    <dl className="record">
      <dt>Rule ID</dt>
      <dd><code>{rule.id}</code> (v{rule.version}, reviewed {rule.lastReviewed})</dd>
      <dt>Category</dt>
      <dd>{rule.category} / {rule.subcategory}</dd>
      <dt>School</dt>
      <dd>{rule.school}</dd>
      <dt>Tradition</dt>
      <dd>{rule.tradition}</dd>
      <dt>Rule</dt>
      <dd>{rule.ruleDescription}</dd>
      <dt>Trigger</dt>
      <dd>{rule.triggerConditions}</dd>
      <dt>Method</dt>
      <dd>{rule.calculationMethod}</dd>
      <dt>Constructive expression</dt>
      <dd>{rule.constructiveExpression}</dd>
      <dt>Potential challenge</dt>
      <dd>{rule.potentialChallenge}</dd>
      <dt>Reflection</dt>
      <dd>{rule.reflectionSuggestion}</dd>
      <dt>Confidence</dt>
      <dd>{CONFIDENCE_LABELS[rule.confidence].short}. {rule.confidenceReason}</dd>
      <dt>Source agreement</dt>
      <dd>{rule.sourceAgreement}</dd>
      <dt>Source fidelity</dt>
      <dd>{FIDELITY_LABELS[rule.sourceFidelityStatus].short}</dd>
      <dt>Scientific evidence</dt>
      <dd>{EVIDENCE_LABELS[rule.evidenceClassification].short}. {rule.empiricalValidationStatus}</dd>
      <dt>Sources</dt>
      <dd>
        <ul>
          {srcs.map((s) => (
            <li key={s.id}>
              <ExternalLink href={s.sourceUrl}>{s.sourceTitle}</ExternalLink>
              <span className="muted">
                {' '}
                · author: {s.sourceAuthor ?? 'not identified'} · date: {s.sourceDate ?? 'not identified'} · {s.access === 'search-summary-only' ? 'page not read (search summary only)' : s.access}
              </span>
            </li>
          ))}
        </ul>
      </dd>
      <dt>Known disagreements</dt>
      <dd>{rule.knownDisagreements.length ? <ul>{rule.knownDisagreements.map((x) => <li key={x}>{x}</li>)}</ul> : 'None recorded.'}</dd>
      <dt>Exclusions</dt>
      <dd>{rule.exclusions.length ? <ul>{rule.exclusions.map((x) => <li key={x}>{x}</li>)}</ul> : 'None.'}</dd>
      <dt>Limitations</dt>
      <dd><ul>{rule.limitations.map((x) => <li key={x}>{x}</li>)}</ul></dd>
    </dl>
  );
}

export function VerificationBadge({ analysis, checks }: { analysis: Analysis; checks: Array<{ id: string; description: string; passed: boolean }> }) {
  const passed = checks.filter((c) => c.passed).length;
  const all = passed === checks.length;
  return (
    <div className={`verify ${all ? 'verify-ok' : 'verify-bad'}`} role="status">
      <strong>{all ? '✓ Calculation verified' : '✗ Calculation check failed'}</strong>{' '}
      <span>
        {`(${passed}/${checks.length} arithmetic checks passed for ${analysis.dob.normalised})`}
      </span>
      <details>
        <summary>What was checked?</summary>
        <ul>
          {checks.map((c) => (
            <li key={c.id}>
              {c.passed ? '✓' : '✗'} {c.description}
            </li>
          ))}
        </ul>
        <p className="muted">
          This only covers arithmetic. It says nothing about whether the traditional interpretations are accurate; see the evidence labels on each interpretation.
        </p>
      </details>
    </div>
  );
}

export function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  const auto = useId();
  const hid = id ?? auto;
  return (
    <section aria-labelledby={hid} className="section">
      <h3 id={hid}>{title}</h3>
      {children}
    </section>
  );
}

/** Lets wide tables scroll inside their own region (keyboard-focusable) instead of widening the page. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="table-scroll" role="region" aria-label="Table (scrolls sideways on small screens)" tabIndex={0}>
      {children}
    </div>
  );
}
