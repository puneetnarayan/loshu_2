import { useId } from 'react';
import { useLang } from '../i18n';

const GLOSSARY: Array<[string, string]> = [
  ['Lo Shu Grid', 'A 3×3 magic square (4 9 2 / 3 5 7 / 8 1 6) used in numerology as a fixed map onto which birth-date digits are placed.'],
  ['Magic square', 'A square of numbers where every row, column and diagonal has the same sum. Here the sum is 15 (a mathematical fact).'],
  ['Raw DOB layer', 'Only the non-zero digits of the full date of birth in DD-MM-YYYY. Always kept separate from overlays.'],
  ['Overlay', 'Optional extra numbers (Driver, Destiny) counted in a separate layer when a mode is selected. They never rewrite the raw digits. One mode follows the Indian pool rule: Destiny always, Driver unless the day is 1–9, 10, 20 or 30.'],
  ['Driver (Moolank, Birth Number)', 'The digits of the day of birth added and reduced to a single digit 1–9. Month and year are not used.'],
  ['Destiny (Bhagyank, Conductor)', 'All digits of the full date added and reduced to a single digit 1–9. Master numbers are not preserved.'],
  ['Kua', 'A Feng Shui (Eight Mansions) number from the birth year and one of two traditional formulas. It is shown in its own optional section, never added to the grid. The year starts at Li Chun (3, 4 or 5 February), so births on those days show both candidates.'],
  ['Present / Repeated / Missing', 'Present: count of at least 1. Repeated: count of 2 or more. Missing: count of 0.'],
  ['Line, arrow, plane', 'Any of the eight straight lines of three cells (3 rows, 3 columns, 2 diagonals). Names such as "mental plane" or "arrow of determination" are traditional labels that differ between sources.'],
  ['Complete / partial / empty line', 'Complete: all three digits present. Empty: all three missing. Partial: one or two present.'],
  ['Source fidelity', 'How faithfully a rule represents an identified source. No source page could be opened, so the strongest label is "Several search summaries agree"; "Source not directly verified" is weaker (one summary).'],
  ['Barnum (Forer) effect', 'The tendency to rate vague, general descriptions as highly accurate for oneself. It is one reason that feeling a reading fits is not evidence that it is valid.'],
  ['Scientific evidence label', 'Whether credible controlled research supports the claim. Traditional interpretations here carry the label "not scientifically validated".'],
  ['Rule ID', 'A stable identifier (for example NUM-5-MISSING) so any conclusion can be traced to the catalogue entry that produced it.'],
];

const ZH_HELP: Array<[string, string]> = [
  ['九宮格是什麼。', '源自中國傳統的 3×3 幻方，在命理中作為固定版面使用：4 9 2 / 3 5 7 / 8 1 6。每一條三個數字的線，和都是 15。'],
  ['本工具做什麼。', '把出生日期的數字放到九宮格上並計算次數，找出缺少、重複和完整的線，並顯示傳統的說法與來源。'],
  ['如何輸入日期。', '輸入 DD-MM-YYYY（例如 23-11-1994）或使用日曆選擇器；完整且有效的日期一出現，結果就會自動更新。不可能的日期會被拒絕，而不是被猜測。'],
  ['如何計算。', '日期依「日、月、年」讀取，零會被排除，其餘每個數字被計算並放進它固定的位置。'],
  ['出現、重複、缺少。', '出現表示至少一次；重複表示兩次或以上；缺少表示零次。在此傳統中，缺少的數字是反思的題材，重複則是一種強調，而不是定論。'],
  ['箭頭與層面。', '每條三格的直線都會被檢查。完整的線三個數字都有；空的線一個也沒有。線的名稱因流派而異，有些有爭議。'],
  ['驅動數與命運數疊加（進階頁）。', '由日期推導的選用額外數字，會計入獨立的一層，因此原始日期數字保持不變。是否納入取決於流派。'],
  ['如何閱讀標示。', '「計算已驗證」表示算術檢查通過。證據標示說明科學是否支持該意義（此處：傳統，未經驗證）。來源標示說明文字與來源的連結程度。信心標示（含「低信心」提示）說明這些措辭值得多少信任。它們不會被合併成一個百分比。'],
  ['限制。', '這些意義屬於傳統象徵。我們沒有找到可靠的對照證據顯示出生日期九宮格能預測性格或事件。文字依據多個網頁來源的摘要，而不是全文。巴納姆（佛瑞）效應也可能讓解讀顯得準確，因此「覺得適合」並不是證據。請不要用於醫療、財務、法律或感情決定。'],
  ['為什麼放在這裡。', '它為命理應用提供可重現、透明的計算，以及可追溯、標明來源的解讀，讓使用者與從業者看到每句話如何產生，並比較不同的約定。'],
];
const ZH_GLOSSARY: Array<[string, string]> = [
  ['洛書九宮格', '一個 3×3 幻方（4 9 2 / 3 5 7 / 8 1 6），在命理中作為固定地圖，把出生日期的數字放上去。'],
  ['幻方', '每一行、每一列、每條對角線的和都相同的數字方陣。這裡的和是 15（算術事實）。'],
  ['原始出生日期層', '只有完整出生日期 DD-MM-YYYY 中的非零數字，永遠與疊加層分開。'],
  ['疊加', '選用的額外數字（驅動數、命運數），在選擇模式時計入獨立的一層，絕不改寫原始數字。有一種模式採用印度「數字池」規則：命運數一定加入；驅動數只在日期不是 1–9、10、20、30 時加入。'],
  ['驅動數（Moolank、出生數）', '把出生「日」的各位數字相加，再化為單一數字 1–9。不使用月與年。'],
  ['命運數（Bhagyank、導引數）', '把完整日期的所有數字相加，再化為單一數字 1–9。不保留大師數。'],
  ['卦數（Kua）', '由出生年與兩種傳統公式之一得出的風水數字，在獨立的選用區塊中顯示，絕不加入九宮格。年份從立春（2 月 3、4 或 5 日）起算，因此這幾天出生的人會顯示兩個候選結果。'],
  ['出現／重複／缺少', '出現：次數至少 1。重複：次數 2 或以上。缺少：次數 0。'],
  ['線、箭頭、層面', '方陣中三格一線的八條直線（3 行、3 列、2 條對角線）。「心智層面」「意志箭頭」等名稱是傳統標籤，各來源不同。'],
  ['完整／局部／空的線', '完整：三個數字都出現。空：三個都缺少。局部：出現一個或兩個。'],
  ['來源可信度', '規則與已識別來源的貼合程度。因為無法開啟任何來源網頁，最強的標示是「多個搜尋摘要一致」；「來源未直接核實」較弱（單一摘要）。'],
  ['巴納姆（佛瑞）效應', '人們傾向把籠統的描述評為非常符合自己。這是「覺得適合」不等於「有效」的原因之一。'],
  ['規則編號', '穩定的識別碼（例如 NUM-5-MISSING），讓每個結論都能追溯到產生它的目錄條目。'],
  ['信心標示', '每個規則都有「中度」「低」或「極低」信心，以及原因；傳統解讀絕不會被評為「高」。'],
];

export function HelpPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { tr, isZh } = useLang();
  const id = useId();
  return (
    <div className="help">
      <button type="button" className="btn" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        {open ? tr('Hide help', '隱藏說明') : tr('Help: about this tab', '說明：關於本頁')}
      </button>
      {open && (
        <div id={id} className="panel help-body" role="region" aria-label={tr('About this tab', '關於本頁')}>
          <h2>{tr('About the Lo Shu Grid tab', '關於洛書九宮格頁面')}</h2>
          {isZh ? (
            <>
              <ol>{ZH_HELP.map(([t, d]) => <li key={t}><strong>{t}</strong> {d}</li>)}</ol>
              <h3>詞彙表</h3>
              <dl className="glossary">{ZH_GLOSSARY.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
            </>
          ) : (
            <>
          <ol>
            <li><strong>What the grid is.</strong> A 3×3 magic square from Chinese tradition, used in numerology as a fixed layout: 4 9 2 / 3 5 7 / 8 1 6. Every line of three adds to 15.</li>
            <li><strong>What this does.</strong> It places the digits of a date of birth onto that grid, counts them, finds missing, repeated and complete lines, and shows what the tradition says, with sources.</li>
            <li><strong>Entering a date.</strong> Type DD-MM-YYYY (for example 23-11-1994) or use the calendar picker, then press Calculate. Impossible dates are rejected, never guessed.</li>
            <li><strong>How it is calculated.</strong> The date is read as day, month, year. Zeros are dropped. Each remaining digit is counted and placed in its fixed cell.</li>
            <li><strong>Present, repeated, missing.</strong> Present means it appears at least once; repeated means two or more; missing means zero. Within this tradition a missing number is a topic for reflection and a repeated one is an emphasis, not a verdict.</li>
            <li><strong>Arrows and planes.</strong> Each straight line of three cells is checked. A complete line has all three digits; an empty line has none. Line names vary by school and some are disputed.</li>
            <li><strong>Driver and Destiny overlays (Advanced).</strong> Optional extra numbers derived from the date. They are counted in a separate layer so the raw date digits stay unchanged. Whether to include them depends on the school.</li>
            <li><strong>Reading the labels.</strong> "Calculation verified" means the arithmetic checks passed. The evidence label tells you whether science supports the meaning (here: traditional, not validated). The source label says how well the wording is tied to its source. These are never combined into a percentage.</li>
            <li><strong>Limitations.</strong> The meanings are traditional symbolism. No credible controlled evidence was identified that birth-date grids predict personality or events. The wording is based on summaries of several web sources, not their full texts. A reading can also feel accurate for reasons unrelated to validity (the Barnum or Forer effect), so a sense of fit is not evidence. Do not use it for medical, financial, legal or relationship decisions.</li>
            <li><strong>Why it is here.</strong> It gives a numerology app a reproducible, transparent calculation with a traceable, source-labelled reading, so users and practitioners can see exactly how each statement arose and compare conventions.</li>
          </ol>
          <h3>Glossary</h3>
          <dl className="glossary">
            {GLOSSARY.map(([t, d]) => (
              <div key={t}>
                <dt>{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
            </>
          )}
        </div>
      )}
    </div>
  );
}
