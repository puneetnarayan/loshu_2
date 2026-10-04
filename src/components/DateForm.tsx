import { useId } from 'react';
import type { FormEvent } from 'react';
import { isoToDdMmYyyy } from '../loshu';

interface Props {
  value: string;
  name: string;
  error: string | null;
  onChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onBlur: () => void;
  onReset: () => void;
  onReport: () => void;
  canReport: boolean;
}

export function DateForm({ value, name, error, onChange, onNameChange, onBlur, onReset, onReport, canReport }: Props) {
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
        </div>
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
        <button type="button" className="btn btn-primary" onClick={onReport} disabled={!canReport} aria-describedby={`${hintId}-pdf`}>
          Report PDF
        </button>
      </div>
      <p id={`${hintId}-pdf`} className="muted small">
        {canReport
          ? 'Results update automatically as you type a complete date. “Report PDF” opens your browser’s print dialog: choose “Save as PDF”.'
          : 'Enter a complete, valid date to see the reading and enable the PDF report.'}
      </p>
      <p className="privacy">
        <strong>Privacy:</strong> everything is calculated in your browser. Your name and date of birth are not sent anywhere, not saved in browser storage and not used in any link or file name. It disappears when you reset or close the page.
      </p>
    </form>
  );
}
