import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { KeyboardEvent } from 'react';
import { Advanced } from './components/Advanced';
import { Basic } from './components/Basic';
import { DateForm } from './components/DateForm';
import { GridView, CellDetail } from './components/GridView';
import type { GridLayer, Orientation } from './components/GridView';
import { HelpPanel } from './components/Help';
import { PrintReport } from './components/PrintReport';
import { buildReport, parseDob } from './loshu';
import { EXTRAS } from './data/schema';
import type { Extra } from './data/schema';
import type { Digit, OverlayModeId } from './loshu';

type Tab = 'basic' | 'advanced';

// Starting values requested by the owner. The name is only a display label: it is not used in any calculation.
const DEFAULT_NAME = 'Puneet Narayan';
const DEFAULT_DOB_TEXT = '02-06-1970';

const TABS: Array<{ id: Tab; label: string; blurb: string }> = [
  { id: 'basic', label: 'Basic', blurb: 'Plain-language reading' },
  { id: 'advanced', label: 'Advanced', blurb: 'Full calculation and sources' },
];

export function App() {
  const [tab, setTab] = useState<Tab>('advanced'); // Advanced is the default
  const [text, setText] = useState(DEFAULT_DOB_TEXT);
  const [name, setName] = useState(DEFAULT_NAME);
  const [touched, setTouched] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [mode, setMode] = useState<OverlayModeId>('dob-only');
  const [layer, setLayer] = useState<GridLayer>('raw');
  const [extras, setExtras] = useState<Extra[]>([...EXTRAS]); // Advanced shows every optional reading by default
  const [orientation, setOrientation] = useState<Orientation>('modern');
  const [compareText, setCompareText] = useState('');
  const asOf = useMemo(() => new Date(), []); // fixed for the session so the personal year is stable
  const [selected, setSelected] = useState<Digit | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ basic: null, advanced: null });

  // Live: the date is parsed on every change, so the reading updates as soon as a valid date is complete.
  const parsed = useMemo(() => parseDob(text), [text]);
  const dob = parsed.ok ? parsed.dob : null;
  // Show an error once the text is complete-length or the field was left; stay quiet while typing.
  const error = !parsed.ok && text.trim() !== '' && (text.trim().length >= 10 || touched) ? parsed.error : null;

  // Both tabs call the same engine. Basic is always DOB-only; Advanced uses the chosen overlay mode.
  const basicReport = useMemo(() => (dob ? buildReport(dob, 'dob-only', { asOf }) : null), [dob, asOf]);
  const advancedReport = useMemo(() => (dob ? buildReport(dob, mode, { extras, name, asOf }) : null), [dob, mode, extras, name, asOf]);

  const reset = () => {
    setText('');
    setName('');
    setTouched(false);
    setMode('dob-only');
    setLayer('raw');
    setExtras([...EXTRAS]);
    setOrientation('modern');
    setCompareText('');
    setSelected(null);
  };
  // The report component is mounted only while printing so it never duplicates the on-screen content.
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true));
    const after = () => setPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

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
      <div className="screen-only">
      <header className="header">
        <h1>Lo Shu Grid Calculator</h1>
        <p className="muted">Deterministic calculation with a transparent, source-labelled traditional reading. Runs entirely in your browser.</p>
        <HelpPanel open={helpOpen} onToggle={() => setHelpOpen((o) => !o)} />
      </header>

      <DateForm value={text} name={name} error={error} onChange={setText} onNameChange={setName} onBlur={() => setTouched(true)} onReset={reset} onReport={() => window.print()} canReport={dob !== null} />

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
            extras={extras}
            onExtras={setExtras}
            orientation={orientation}
            onOrientation={setOrientation}
            compareText={compareText}
            onCompareText={setCompareText}
            name={name}
            asOf={asOf}
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
      {printing && advancedReport && (
        <div className="print-only">
          <PrintReport report={advancedReport} name={name} extras={extras} compareText={compareText} />
        </div>
      )}
    </div>
  );
}

function EmptyState({ id, selected, onSelect }: { id: Tab; selected: Digit | null; onSelect: (d: Digit) => void }) {
  return (
    <div id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} tabIndex={0} className="tabpanel">
      <p className="intro">Enter a complete, valid date of birth above. The reading appears automatically as soon as the date is complete. This is the fixed grid your digits will be placed on:</p>
      <GridView analysis={null} selected={selected} onSelect={onSelect} variant={id} />
      <CellDetail digit={null} analysis={null} triggered={[]} variant={id} />
    </div>
  );
}
