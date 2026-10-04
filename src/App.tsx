import { useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Advanced } from './components/Advanced';
import { Basic } from './components/Basic';
import { DateForm } from './components/DateForm';
import { GridView, CellDetail } from './components/GridView';
import type { GridLayer } from './components/GridView';
import { HelpPanel } from './components/Help';
import { buildReport, parseDob } from './loshu';
import type { Digit, OverlayModeId, ParsedDob } from './loshu';

type Tab = 'basic' | 'advanced';

// Starting values requested by the owner. The name is only a display label: it is not used in any calculation.
const DEFAULT_NAME = 'Puneet Narayan';
const DEFAULT_DOB_TEXT = '02-06-1970';

function initialDob(): ParsedDob | null {
  const r = parseDob(DEFAULT_DOB_TEXT);
  return r.ok ? r.dob : null;
}
const TABS: Array<{ id: Tab; label: string; blurb: string }> = [
  { id: 'basic', label: 'Basic', blurb: 'Plain-language reading' },
  { id: 'advanced', label: 'Advanced', blurb: 'Full calculation and sources' },
];

export function App() {
  const [tab, setTab] = useState<Tab>('advanced'); // Advanced is the default
  const [text, setText] = useState(DEFAULT_DOB_TEXT);
  const [name, setName] = useState(DEFAULT_NAME);
  const [dob, setDob] = useState<ParsedDob | null>(initialDob);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<OverlayModeId>('dob-only');
  const [layer, setLayer] = useState<GridLayer>('raw');
  const [planetary, setPlanetary] = useState(false);
  const [selected, setSelected] = useState<Digit | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ basic: null, advanced: null });

  // Both tabs call the same engine. Basic is always DOB-only; Advanced uses the chosen overlay mode.
  const basicReport = useMemo(() => (dob ? buildReport(dob, 'dob-only') : null), [dob]);
  const advancedReport = useMemo(() => (dob ? buildReport(dob, mode, { planetary }) : null), [dob, mode, planetary]);

  const submit = () => {
    const r = parseDob(text);
    if (r.ok) {
      setDob(r.dob);
      setError(null);
    } else {
      setDob(null);
      setError(r.error);
    }
  };
  const reset = () => {
    setText('');
    setName('');
    setDob(null);
    setError(null);
    setMode('dob-only');
    setLayer('raw');
    setPlanetary(false);
    setSelected(null);
  };
  const changeMode = (m: OverlayModeId) => {
    setMode(m);
    setLayer(m === 'dob-only' ? 'raw' : 'combined');
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const last = TABS.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: (i + 1) % TABS.length,
      ArrowLeft: (i - 1 + TABS.length) % TABS.length,
      Home: 0,
      End: last,
    };
    const next = moves[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const target = TABS[next]!.id;
    setTab(target);
    tabRefs.current[target]?.focus();
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Lo Shu Grid Calculator</h1>
        <p className="muted">Deterministic calculation with a transparent, source-labelled traditional reading. Runs entirely in your browser.</p>
        <HelpPanel open={helpOpen} onToggle={() => setHelpOpen((o) => !o)} />
      </header>

      <DateForm value={text} name={name} error={error} onChange={setText} onNameChange={setName} onSubmit={submit} onReset={reset} />

      {dob && (
        <p className="prepared">
          Reading for {name.trim() ? <strong>{name.trim()}</strong> : 'the date'} · born <strong>{dob.normalised}</strong>
        </p>
      )}

      <div className="tabs" role="tablist" aria-label="Lo Shu view">
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className={`tab${tab === t.id ? ' tab-active' : ''}`}
            onClick={() => setTab(t.id)}
            onKeyDown={onTabKey}
          >
            <strong>{t.label}</strong>
            <span className="small">{t.blurb}</span>
          </button>
        ))}
      </div>

      {tab === 'basic' &&
        (basicReport ? (
          <Basic report={basicReport} selected={selected} onSelect={setSelected} />
        ) : (
          <EmptyState id="basic" selected={selected} onSelect={setSelected} />
        ))}
      {tab === 'advanced' &&
        (advancedReport ? (
          <Advanced
            report={advancedReport}
            mode={mode}
            onMode={changeMode}
            layer={layer}
            onLayer={setLayer}
            planetary={planetary}
            onPlanetary={setPlanetary}
            selected={selected}
            onSelect={setSelected}
          />
        ) : (
          <EmptyState id="advanced" selected={selected} onSelect={setSelected} />
        ))}

      <footer className="footer muted small">
        Traditional interpretations are shown for cultural and educational interest. They are not scientifically validated and are not advice.
      </footer>
    </div>
  );
}

function EmptyState({ id, selected, onSelect }: { id: Tab; selected: Digit | null; onSelect: (d: Digit) => void }) {
  return (
    <div id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} tabIndex={0} className="tabpanel">
      <p className="intro">Enter a date of birth above and press Calculate. Here is the fixed grid that your digits will be placed on:</p>
      <GridView analysis={null} selected={selected} onSelect={onSelect} variant={id} />
      <CellDetail digit={null} analysis={null} triggered={[]} variant={id} />
    </div>
  );
}
