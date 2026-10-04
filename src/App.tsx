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
import { reportBlocks } from './report/blocks';
import { LangProvider, useLang } from './i18n';
import type { Lang } from './i18n';
import { ZH_NOTICE } from './i18n/zh';
import { buildReport, parseDob } from './loshu';
import { DEFAULT_EXTRAS } from './data/schema';
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
  const [lang, setLang] = useState<Lang>('en');
  return (
    <LangProvider lang={lang}>
      <AppInner lang={lang} onLang={setLang} />
    </LangProvider>
  );
}

function AppInner({ lang, onLang }: { lang: Lang; onLang: (l: Lang) => void }) {
  const { tr, isZh } = useLang();
  const [tab, setTab] = useState<Tab>('advanced'); // Advanced is the default
  const [text, setText] = useState(DEFAULT_DOB_TEXT);
  const [name, setName] = useState(DEFAULT_NAME);
  const [kuaFormula, setKuaFormula] = useState<'both' | 'male' | 'female'>('both');
  const [touched, setTouched] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [brand, setBrand] = useState({ business: '', contact: '', operator: '' });
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [mode, setMode] = useState<OverlayModeId>('dob-only');
  const [layer, setLayer] = useState<GridLayer>('raw');
  const [extras, setExtras] = useState<Extra[]>([...DEFAULT_EXTRAS]); // Advanced shows every optional reading except gemstones by default
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
  const advancedReport = useMemo(() => (dob ? buildReport(dob, mode, { extras, name, asOf, kuaFormula }) : null), [dob, mode, extras, name, asOf, kuaFormula]);

  const reset = () => {
    setText('');
    setName('');
    setKuaFormula('both');
    setTouched(false);
    setPdfError(null);
    setMode('dob-only');
    setLayer('raw');
    setExtras([...DEFAULT_EXTRAS]);
    setBrand({ business: '', contact: '', operator: '' });
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

  // Direct download: built entirely in the browser; the file name and metadata never contain the name or date.
  const downloadReport = async () => {
    if (!advancedReport) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      const generated = asOf.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      const { downloadBytes, renderPdf } = await import('./pdf/renderPdf'); // loaded only when a PDF is requested
      const bytes = await renderPdf(reportBlocks(advancedReport, { name, extras, compareText, generated, brand }));
      downloadBytes(bytes, 'lo-shu-report.pdf');
    } catch {
      setPdfError('The PDF could not be created. Try “Print / Save as PDF” instead.');
    } finally {
      setPdfBusy(false);
    }
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
    <div className="app" lang={isZh ? 'zh-Hant' : 'en'}>
      <div className="screen-only">
      <header className="header">
        <h1>{tr('Lo Shu Grid Calculator', '洛書九宮格計算器')}</h1>
        <p className="muted">{tr('Deterministic calculation with a transparent, source-labelled traditional reading. Runs entirely in your browser.', '以確定性的計算搭配透明、標明來源的傳統解讀。完全在你的瀏覽器中執行。')}</p>
        <div className="lang-switch" role="group" aria-label="Language / 語言">
          <button type="button" className={`btn${lang === 'en' ? ' btn-primary' : ''}`} aria-pressed={lang === 'en'} onClick={() => onLang('en')}>English</button>
          <button type="button" className={`btn${lang === 'zh-TW' ? ' btn-primary' : ''}`} aria-pressed={lang === 'zh-TW'} onClick={() => onLang('zh-TW')} lang="zh-Hant">繁體中文</button>
        </div>
        {isZh && <p className="rider rider-low" role="note">{ZH_NOTICE}</p>}
        <HelpPanel open={helpOpen} onToggle={() => setHelpOpen((o) => !o)} />
      </header>

      <DateForm value={text} name={name} brand={brand} onBrand={setBrand} kuaFormula={kuaFormula} onKuaFormula={setKuaFormula} error={error} onChange={setText} onNameChange={setName} onBlur={() => setTouched(true)} onReset={reset} onReport={downloadReport} onPrint={() => window.print()} canReport={dob !== null} busy={pdfBusy} reportError={pdfError} />

      {dob && (
        <p className="prepared">
          {tr('Reading for ', '解讀對象：')}{name.trim() ? <strong>{name.trim()}</strong> : tr('the date', '這個日期')} · {tr('born ', '出生日期 ')}<strong>{dob.normalised}</strong>
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
            <strong>{isZh ? (t.id === 'basic' ? '基本' : '進階') : t.label}</strong>
            <span className="small">{isZh ? (t.id === 'basic' ? '白話解讀' : '完整計算與來源（英文）') : t.blurb}</span>
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
        {tr('Traditional interpretations are shown for cultural and educational interest. They are not scientifically validated and are not advice.', '傳統解讀僅供文化與教育興趣。它們未經科學驗證，也不是建議。')}
      </footer>
      </div>
      {printing && advancedReport && (
        <div className="print-only">
          <PrintReport report={advancedReport} name={name} extras={extras} compareText={compareText} brand={brand} />
        </div>
      )}
    </div>
  );
}

function EmptyState({ id, selected, onSelect }: { id: Tab; selected: Digit | null; onSelect: (d: Digit) => void }) {
  const { tr } = useLang();
  return (
    <div id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} tabIndex={0} className="tabpanel">
      <p className="intro">{tr('Enter a complete, valid date of birth above. The reading appears automatically as soon as the date is complete. This is the fixed grid your digits will be placed on:', '請在上方輸入完整且有效的出生日期。日期一完整，解讀就會自動出現。這是你的數字將被放入的固定九宮格：')}</p>
      <GridView analysis={null} selected={selected} onSelect={onSelect} variant={id} />
      <CellDetail digit={null} analysis={null} triggered={[]} variant={id} />
    </div>
  );
}
