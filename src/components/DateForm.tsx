import { useId } from 'react';
import type { FormEvent } from 'react';
import { isoToDdMmYyyy } from '../loshu';

interface Props {
  value: string;
  name: string;
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

export function DateForm({ value, name, kuaFormula, onKuaFormula, error, onChange, onNameChange, onBlur, onReset, onReport, onPrint, canReport, busy, reportError }: Props) {
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const submit = (e: FormEvent) => {
    e.preventDefault(); // results update live; Enter does nothing extra
  };
  return (
    <form className="panel date-form" onSubmit={submit} noValidate aria-label="Date of birth">
      <div className="field">
        <div className="field-row">
          <div>
            <label htmlFor={`${id}-name`}>Name (optional)</label>
            <input
              id={`${id}-name`}
              type="text"
              autoComplete="off"
              maxLength={60}
              placeholder="Your name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              aria-describedby={`${hintId}-name`}
            />
          </div>
          <div>
            <label htmlFor={`${id}-dob`}>Date of birth (DD-MM-YYYY)</label>
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
            <label className="picker" htmlFor={`${id}-pick`}>Or pick from a calendar</label>
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
            <label htmlFor={`${id}-kua`}>Kua formula (optional)</label>
            <select id={`${id}-kua`} value={kuaFormula} onChange={(e) => onKuaFormula(e.target.value as 'both' | 'male' | 'female')} aria-describedby={`${hintId}-kua`}>
              <option value="both">Show both formulas</option>
              <option value="male">Male formula</option>
              <option value="female">Female formula</option>
            </select>
          </div>
        </div>
        <p id={`${hintId}-kua`} className="muted small">
          Only used for the optional Kua (Feng Shui) reading. Kua has two traditional formulas, historically labelled male and female; “show both” interprets neither. Nothing is stored.
        </p>
        <p id={`${hintId}-name`} className="muted small">
          The name is only shown as a label on this page. It is not used in any calculation.
        </p>
        <p id={hintId} className="muted small">
          Day first, then month, then four-digit year. Gregorian calendar, from 15-10-1582. No name, birth time or place is needed.
        </p>
        {error && (
          <p id={errId} className="error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="actions">
        <button type="button" className="btn" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="btn btn-primary" onClick={onReport} disabled={!canReport || busy} aria-describedby={`${hintId}-pdf`}>
          {busy ? 'Preparing PDF…' : 'Report PDF'}
        </button>
        <button type="button" className="btn" onClick={onPrint} disabled={!canReport} aria-describedby={`${hintId}-pdf`}>
          Print / Save as PDF
        </button>
      </div>
      {reportError && (
        <p className="error" role="alert">
          {reportError}
        </p>
      )}
      <p id={`${hintId}-pdf`} className="muted small">
        {canReport
          ? 'Results update automatically as you type a complete date. “Report PDF” downloads a file named lo-shu-report.pdf (no name or date in the file name or metadata). “Print / Save as PDF” uses your browser’s print dialog instead and can print any characters in a name.'
          : 'Enter a complete, valid date to see the reading and enable the PDF report.'}
      </p>
      <p className="privacy">
        <strong>Privacy:</strong> everything is calculated in your browser. Your name and date of birth are not sent anywhere, not saved in browser storage and not used in any link or file name. It disappears when you reset or close the page.
      </p>
    </form>
  );
}
