import { DIGIT_KEYWORDS } from '../data/rules';
import { GRID_LAYOUT, positionLabel, POSITIONS } from '../loshu';
import { useLang, useRuleText, ZH_POSITION } from '../i18n';
import { ZH_DIGIT } from '../i18n/zh';
import type { Analysis, Digit, DigitStat } from '../loshu';
import type { TriggeredRule } from '../loshu';
import { Derivation, EvidenceLabel, StatusTag } from './shared';

export type GridLayer = 'raw' | 'overlay' | 'combined';
export type Orientation = 'modern' | 'historical';

/**
 * 'historical' mirrors each row left-to-right (2-9-4 / 7-5-3 / 6-1-8), the arrangement some summaries attribute to
 * the early sources. It only changes where cells are drawn: counts, lines and every calculation are identical.
 */
export function displayRows(orientation: Orientation): Digit[][] {
  return GRID_LAYOUT.map((row) => (orientation === 'historical' ? [...row].reverse() : [...row]));
}
export function displayPosition(digit: Digit, orientation: Orientation): string {
  const p = POSITIONS[digit];
  return positionLabel(p.row, orientation === 'historical' ? 2 - p.col : p.col);
}

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
  orientation?: Orientation;
  triggered?: TriggeredRule[];
}

export function GridView({ analysis, selected, onSelect, variant, layer = 'raw', orientation = 'modern', triggered = [] }: Props) {
  const { tr, isZh } = useLang();
  const effectiveLayer: GridLayer = variant === 'basic' ? 'raw' : layer;
  return (
    <div className="grid-wrap">
      <p className={`layer-label layer-${effectiveLayer}`} role="note">
        {tr('Showing: ', '顯示：')}<strong>{isZh && effectiveLayer === 'raw' ? '原始出生日期層：只計算出生日期中的非零數字' : LAYER_TEXT[effectiveLayer]}</strong>
      </p>
      <div
        className="lo-grid"
        role="group"
        aria-label={
          orientation === 'historical'
            ? 'Lo Shu grid, historical mirror layout: 2 9 4 on top, 7 5 3 in the middle, 6 1 8 on the bottom'
            : 'Lo Shu grid, fixed 3 by 3 layout: 4 9 2 on top, 3 5 7 in the middle, 8 1 6 on the bottom'
        }
      >
        {displayRows(orientation).flat().map((digit) => {
          const stat = analysis?.digits.find((s) => s.digit === digit);
          const count = stat ? countFor(stat, effectiveLayer) : 0;
          const status = statusFor(count);
          const ruleCount = triggered.filter((t) => t.rule.requiredDigits.includes(digit) || t.rule.requiredCounts.some((c) => c.digit === digit)).length;
          const label = !stat
            ? tr(`Number ${digit}. Enter a date of birth to see its count.`, `數字 ${digit}。輸入出生日期即可看到次數。`)
            : tr(
                `Number ${digit}, ${displayPosition(digit, orientation)}. Appears ${count} ${count === 1 ? 'time' : 'times'}. ${status}.`,
                `數字 ${digit}，${ZH_POSITION[displayPosition(digit, orientation)] ?? ''}。出現 ${count} 次。${({ missing: '缺少', present: '出現', repeated: '重複' } as const)[status]}。`,
              );
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
                    <span className="cell-note">{isZh ? ZH_DIGIT[digit].kw : DIGIT_KEYWORDS[digit]}</span>
                  ) : (
                    <span className="cell-note">
                      raw {stat.rawCount} + overlay {stat.overlayCount} = {stat.combinedCount}
                      <br />
                      {stat.combinedCount > 0 ? 'cell active' : 'cell inactive'} · {ruleCount} rule{ruleCount === 1 ? '' : 's'}
                    </span>
                  )}
                </>
              ) : (
                <span className="cell-note">{isZh ? ZH_DIGIT[digit].kw : DIGIT_KEYWORDS[digit]}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="muted small">
        {isZh ? '數字永遠不會移動：4 9 2 / 3 5 7 / 8 1 6。方陣中每一行、每一列和每條對角線的和都是 15。' : orientation === 'historical'
          ? 'Historical mirror view (2 9 4 / 7 5 3 / 6 1 8): only the drawing is mirrored. Counts, lines and results are identical to the modern layout.'
          : 'The digits never move: 4 9 2 / 3 5 7 / 8 1 6. Every row, column and diagonal of the square adds up to 15.'}
      </p>
    </div>
  );
}

export function CellDetail({ digit, analysis, triggered, variant, orientation = 'modern' }: { digit: Digit | null; analysis: Analysis | null; triggered: TriggeredRule[]; variant: 'basic' | 'advanced'; orientation?: Orientation }) {
  const { tr, isZh } = useLang();
  const text = useRuleText();
  if (digit === null || !analysis) {
    return (
      <div className="cell-detail" aria-live="polite">
        <p className="muted">{tr('Select a number in the grid to see what it means and how it was counted.', '選擇九宮格中的一個數字，查看它的意義與計算方式。')}</p>
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
        {tr('Number ', '數字 ')}{digit} · {isZh ? ZH_POSITION[displayPosition(digit, orientation)] : displayPosition(digit, orientation)}
      </h4>
      <p>
        <StatusTag status={statusFor(count)} count={count} />{' '}
        {variant === 'advanced' && (
          <span className="muted">(raw {stat.rawCount}, overlay {stat.overlayCount}, total {stat.combinedCount})</span>
        )}
      </p>
      {shown.length === 0 ? (
        <p>{tr('No documented rule applies to this number in the current view.', '在目前的檢視中，沒有已記載的規則適用於此數字。')}</p>
      ) : (
        shown.map((t) => (
          <div key={t.rule.id} className="rule-block">
            <p>{variant === 'basic' ? text.basic(t.rule) : t.rule.advancedText}</p>
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
        {tr(`This number always sits in the ${displayPosition(digit, orientation)} cell.`, `此數字永遠位於${ZH_POSITION[displayPosition(digit, orientation)] ?? ''}格。`)}
      </p>
    </div>
  );
}
