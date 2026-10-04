import { useId } from 'react';
import type { FormEvent } from 'react';
import { useLang } from '../i18n';
import { zhDateError } from '../i18n/zh';
import { isoToDdMmYyyy } from '../loshu';

interface Props {
  value: string;
  name: string;
  brand: { business: string; contact: string; operator: string };
  onBrand: (b: { business: string; contact: string; operator: string }) => void;
  kuaFormula: 'both' | 'male' | 'female';
  onKuaFormula: (f: 'both' | 'male' | 'female') => void;
  error: string | null;
  onChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onBlur: () => void;
  onReset: () => void;
  onReport: () => void;
  onPrint: () => void;
  canReport: boolean;
  busy: boolean;
  reportError: string | null;
}

export function DateForm({ value, name, brand, onBrand, kuaFormula, onKuaFormula, error, onChange, onNameChange, onBlur, onReset, onReport, onPrint, canReport, busy, reportError }: Props) {
  const { tr, isZh } = useLang();
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const submit = (e: FormEvent) => {
    e.preventDefault(); // results update live; Enter does nothing extra
  };
  return (
    <form className="panel date-form" onSubmit={submit} noValidate aria-label={tr('Date of birth', '出生日期')}>
      <div className="field">
        <div className="field-row">
          <div>
            <label htmlFor={`${id}-name`}>{tr('Name (optional)', '姓名（選填）')}</label>
            <input
              id={`${id}-name`}
              type="text"
              autoComplete="off"
              maxLength={60}
              placeholder={tr('Your name', '你的姓名')}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              aria-describedby={`${hintId}-name`}
            />
          </div>
          <div>
            <label htmlFor={`${id}-dob`}>{tr('Date of birth (DD-MM-YYYY)', '出生日期 (DD-MM-YYYY)')}</label>
            <input
              id={`${id}-dob`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="23-11-1994"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${hintId} ${errId}` : hintId}
              maxLength={10}
            />
          </div>
          <div>
            <label className="picker" htmlFor={`${id}-pick`}>{tr('Or pick from a calendar', '或從日曆選擇')}</label>
            <input
              id={`${id}-pick`}
              type="date"
              min="1582-10-15"
              onChange={(e) => {
                const t = isoToDdMmYyyy(e.target.value);
                if (t) onChange(t);
              }}
            />
          </div>
          <div>
            <label htmlFor={`${id}-kua`}>{tr('Kua formula (optional)', '卦數公式（選填）')}</label>
            <select id={`${id}-kua`} value={kuaFormula} onChange={(e) => onKuaFormula(e.target.value as 'both' | 'male' | 'female')} aria-describedby={`${hintId}-kua`}>
              <option value="both">{tr('Show both formulas', '兩種公式都顯示')}</option>
              <option value="male">{tr('Male formula', '男性公式')}</option>
              <option value="female">{tr('Female formula', '女性公式')}</option>
            </select>
          </div>
        </div>
        <p id={`${hintId}-kua`} className="muted small">
          {tr('Only used for the optional Kua (Feng Shui) reading. Kua has two traditional formulas, historically labelled male and female; “show both” interprets neither. Nothing is stored.', '僅用於選填的卦數（風水）解讀。卦數有兩種傳統公式，歷史上稱為男性與女性公式；選「兩種公式都顯示」則不解讀任何一種。不會儲存任何資料。')}
        </p>
        <p id={`${hintId}-name`} className="muted small">
          {tr('The name is only shown as a label on this page. It is not used in any calculation.', '姓名只作為本頁的標籤，不用於任何計算。')}
        </p>
        <p id={hintId} className="muted small">
          {tr('Day first, then month, then four-digit year. Gregorian calendar, from 15-10-1582. No name, birth time or place is needed.', '先寫日、再寫月、最後是四位數年份。公曆，自 1582-10-15 起。不需要姓名、出生時間或地點。')}
        </p>
        {error && (
          <p id={errId} className="error" role="alert">
            {isZh ? zhDateError(error) : error}
          </p>
        )}
      </div>
      <details className="brand">
        <summary>{tr('Report branding (optional)', '報告品牌（選填）')}</summary>
        <p className="muted small">{tr('Shown at the top of the PDF and printed report only. Not stored, not sent anywhere and not used in the file name.', '只會顯示在 PDF 與列印報告的最上方。不儲存、不傳送，也不用於檔名。')}</p>
        <div className="field-row">
          {(['business', 'operator', 'contact'] as const).map((k) => (
            <div key={k}>
              <label htmlFor={`${id}-brand-${k}`}>{k === 'business' ? tr('Business name', '公司／機構名稱') : k === 'operator' ? tr('Prepared by', '製作人') : tr('Contact details', '聯絡資料')}</label>
              <input id={`${id}-brand-${k}`} type="text" autoComplete="off" maxLength={80} value={brand[k]} onChange={(e) => onBrand({ ...brand, [k]: e.target.value })} />
            </div>
          ))}
        </div>
      </details>
      <div className="actions">
        <button type="button" className="btn" onClick={onReset}>
          {tr('Reset', '重設')}
        </button>
        <button type="button" className="btn btn-primary" onClick={onReport} disabled={!canReport || busy} aria-describedby={`${hintId}-pdf`}>
          {busy ? tr('Preparing PDF…', '準備 PDF 中…') : tr('Report PDF', '報告 PDF')}
        </button>
        <button type="button" className="btn" onClick={onPrint} disabled={!canReport} aria-describedby={`${hintId}-pdf`}>
          {tr('Print / Save as PDF', '列印／另存為 PDF')}
        </button>
      </div>
      {reportError && (
        <p className="error" role="alert">
          {reportError}
        </p>
      )}
      <p id={`${hintId}-pdf`} className="muted small">
        {canReport
          ? tr('Results update automatically as you type a complete date. “Report PDF” downloads a file named lo-shu-report.pdf (no name or date in the file name or metadata). “Print / Save as PDF” uses your browser’s print dialog instead and can print any characters in a name.', '輸入完整日期後，結果會自動更新。「報告 PDF」會下載名為 lo-shu-report.pdf 的檔案（檔名與中繼資料不含姓名或日期；內容為英文）。「列印／另存為 PDF」改用瀏覽器的列印功能，可列印姓名中的任何字元。')
          : tr('Enter a complete, valid date to see the reading and enable the PDF report.', '輸入完整且有效的日期，即可查看解讀並啟用 PDF 報告。')}
      </p>
      <p className="privacy">
        <strong>{tr('Privacy:', '隱私：')}</strong>{' '}
        {tr('everything is calculated in your browser. Your name and date of birth are not sent anywhere, not saved in browser storage and not used in any link or file name. It disappears when you reset or close the page.', '所有計算都在你的瀏覽器中完成。你的姓名與出生日期不會傳送到任何地方，不會存入瀏覽器儲存空間，也不會用於連結或檔名。重設或關閉頁面後即消失。')}
      </p>
    </form>
  );
}
