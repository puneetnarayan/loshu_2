import { useId } from 'react';
import type { FormEvent } from 'react';
import { isoToDdMmYyyy } from '../loshu';

interface Props {
  value: string;
  name: string;
  error: string | null;
  onChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export function DateForm({ value, name, error, onChange, onNameChange, onSubmit, onReset }: Props) {
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
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
        <button type="submit" className="btn btn-primary">
          Calculate
        </button>
        <button type="button" className="btn" onClick={onReset}>
          Reset
        </button>
      </div>
      <p className="privacy">
        <strong>Privacy:</strong> everything is calculated in your browser. Your name and date of birth are not sent anywhere, not saved in browser storage and not used in any link or file name. It disappears when you reset or close the page.
      </p>
    </form>
  );
}
