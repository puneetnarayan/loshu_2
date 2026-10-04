import { DIGIT_KEYWORDS } from '../data/rules';
import { GRID_LAYOUT } from '../loshu';
import type { Analysis, Digit, DigitStat } from '../loshu';
import type { TriggeredRule } from '../loshu';
import { Derivation, EvidenceLabel, StatusTag } from './shared';

export type GridLayer = 'raw' | 'overlay' | 'combined';

const LAYER_TEXT: Record<GridLayer, string> = {
  raw: 'RAW DOB layer: only the non-zero digits of the date of birth',
  overlay: 'OVERLAY layer: only the numbers added by the selected mode (Driver/Destiny)',
  combined: 'COMBINED view: raw DOB digits plus overlay additions',
};

function countFor(s: DigitStat, layer: GridLayer): number {
  return layer === 'raw' ? s.rawCount : layer === 'overlay' ? s.overlayCount : s.combinedCount;
}

function statusFor(count: number): DigitStat['rawStatus'] {
  return count === 0 ? 'missing' : count === 1 ? 'present' : 'repeated';
}

interface Props {
  analysis: Analysis | null;
  selected: Digit | null;
  onSelect: (d: Digit) => void;
  variant: 'basic' | 'advanced';
  layer?: GridLayer;
  triggered?: TriggeredRule[];
}

export function GridView({ analysis, selected, onSelect, variant, layer = 'raw', triggered = [] }: Props) {
  const effectiveLayer: GridLayer = variant === 'basic' ? 'raw' : layer;
  return (
    <div className="grid-wrap">
      <p className={`layer-label layer-${effectiveLayer}`} role="note">
        Showing: <strong>{LAYER_TEXT[effectiveLayer]}</strong>
      </p>
      <div className="lo-grid" role="group" aria-label="Lo Shu grid, fixed 3 by 3 layout: 4 9 2 on top, 3 5 7 in the middle, 8 1 6 on the bottom">
        {GRID_LAYOUT.flat().map((digit) => {
          const stat = analysis?.digits.find((s) => s.digit === digit);
          const count = stat ? countFor(stat, effectiveLayer) : 0;
          const status = statusFor(count);
          const ruleCount = triggered.filter((t) => t.rule.requiredDigits.includes(digit) || t.rule.requiredCounts.some((c) => c.digit === digit)).length;
          const label = !stat
            ? `Number ${digit}. Enter a date of birth to see its count.`
            : `Number ${digit}, ${stat.position.label}. Appears ${count} ${count === 1 ? 'time' : 'times'}. ${status}.`;
          return (
            <button
              type="button"
              key={digit}
              className={`cell cell-${stat ? status : 'idle'}${selected === digit ? ' cell-selected' : ''}`}
              aria-pressed={selected === digit}
              aria-label={label}
              onClick={() => onSelect(digit)}
              data-digit={digit}
            >
              <span className="cell-digit">{digit}</span>
              {stat ? (
                <>
                  <span className="pips" aria-hidden="true">
                    {count === 0 ? '–' : '●'.repeat(Math.min(count, 6)) + (count > 6 ? '+' : '')}
                  </span>
                  <StatusTag status={status} count={count} />
                  {variant === 'basic' ? (
                    <span className="cell-note">{DIGIT_KEYWORDS[digit]}</span>
                  ) : (
                    <span className="cell-note">
                      raw {stat.rawCount} + overlay {stat.overlayCount} = {stat.combinedCount}
                      <br />
                      {stat.combinedCount > 0 ? 'cell active' : 'cell inactive'} · {ruleCount} rule{ruleCount === 1 ? '' : 's'}
                    </span>
                  )}
                </>
              ) : (
                <span className="cell-note">{DIGIT_KEYWORDS[digit]}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="muted small">The digits never move: 4 9 2 / 3 5 7 / 8 1 6. Every row, column and diagonal of the square adds up to 15.</p>
    </div>
  );
}

export function CellDetail({ digit, analysis, triggered, variant }: { digit: Digit | null; analysis: Analysis | null; triggered: TriggeredRule[]; variant: 'basic' | 'advanced' }) {
  if (digit === null || !analysis) {
    return (
      <div className="cell-detail" aria-live="polite">
        <p className="muted">Select a number in the grid to see what it means and how it was counted.</p>
      </div>
    );
  }
  const stat = analysis.digits.find((s) => s.digit === digit)!;
  const mine = triggered.filter((t) => t.rule.requiredDigits.includes(digit) || t.rule.requiredCounts.some((c) => c.digit === digit));
  const shown = variant === 'basic' ? mine.filter((t) => t.rule.category !== 'planetary') : mine;
  const count = variant === 'basic' ? stat.rawCount : stat.combinedCount;
  return (
    <div className="cell-detail" aria-live="polite">
      <h4>
        Number {digit} · {stat.position.label}
      </h4>
      <p>
        <StatusTag status={statusFor(count)} count={count} />{' '}
        {variant === 'advanced' && (
          <span className="muted">(raw {stat.rawCount}, overlay {stat.overlayCount}, total {stat.combinedCount})</span>
        )}
      </p>
      {shown.length === 0 ? (
        <p>No documented rule applies to this number in the current view.</p>
      ) : (
        shown.map((t) => (
          <div key={t.rule.id} className="rule-block">
            <p>{variant === 'basic' ? t.rule.basicText : t.rule.advancedText}</p>
            <EvidenceLabel rule={t.rule} />
            <Derivation>
              <ol>
                {t.why.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ol>
              <p>{t.rule.calculationExplanation}</p>
              <p className="muted">Rule {t.rule.id}</p>
            </Derivation>
          </div>
        ))
      )}
      <p className="muted small">
        This number always sits in the {stat.position.label} cell.
      </p>
    </div>
  );
}
