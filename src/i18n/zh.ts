import type { InterpretationRule } from '../data/schema';
import type { Digit, Report } from '../loshu';

/**
 * Traditional Chinese texts for the Basic tab. IMPORTANT: written by an AI assistant and NOT reviewed by a native
 * speaker; they follow the English wording one-to-one and carry the same caveats. Advanced, the PDF and the
 * "How was this derived?" details stay in English.
 */
export const ZH_NOTICE =
  '繁體中文為輔助翻譯，尚未經母語人士審閱。進階頁、PDF 報告及「如何得出」的詳細說明目前僅提供英文。';

interface ZhDigit {
  kw: string;
  challenge: string;
  reflect: string;
  missingReflect: string;
  driver: string;
  destiny: string;
}

export const ZH_DIGIT: Record<Digit, ZhDigit> = {
  1: { kw: '獨立、領導力與自我表達', challenge: '過度強勢或不願接受建議', reflect: '每天練習獨立做一個小決定，並留意自己何時壓抑了真正的需求。', missingReflect: '在日常小事上練習表達自己的偏好。', driver: '天生的領導者，自信獨立，有時自我中心', destiny: '獨立、有抱負、具權威感；被描述為適合帶領與開創' },
  2: { kw: '敏感、合作與直覺', challenge: '過度敏感或猶豫不決', reflect: '做決定前，先向朋友或同事了解他們的看法。', missingReflect: '每天在一次對話中練習專心傾聽。', driver: '情感豐富、敏感、直覺強，容易受影響', destiny: '敏感、富想像力、善於合作；是重視夥伴關係的調和者' },
  3: { kw: '創意、表達與溝通', challenge: '注意力分散或話太多', reflect: '安排固定的短時間進行創作或寫作練習。', missingReflect: '嘗試一個壓力小的創作習慣，例如寫簡短日記。', driver: '有創意、善表達，有時不夠穩定', destiny: '有創意、開朗的溝通者；被描述為能啟發他人' },
  4: { kw: '務實、自律與條理', challenge: '僵化或工作過度', reflect: '建立一個小例行，例如每週計畫檢視，同時保留一些彈性。', missingReflect: '試試簡單的清單或每週計畫，幫助自己持續完成事情。', driver: '務實、自律、勤奮，有時固執', destiny: '建設者與組織者，勤奮，建立結構' },
  5: { kw: '平衡、適應力與好奇心', challenge: '躁動或難以安定', reflect: '選一個能帶來穩定的日常習慣，並在其他方面保持對變化的開放。', missingReflect: '留意自己如何面對變化，並每天花一點時間靜下來盤點。', driver: '思維敏捷、精力充沛，喜愛變化與自由', destiny: '適應力強、多才多藝，在變化中成長' },
  6: { kw: '責任、關懷與和諧', challenge: '過度負責或完美主義', reflect: '留意自己在哪些地方承擔過多，練習說不或分擔責任。', missingReflect: '選一段關係，持續投入小小的關懷行動。', driver: '關懷他人、重視關係，喜愛舒適與美', destiny: '負責、關懷，重視人際和諧' },
  7: { kw: '分析、反思與靈性', challenge: '退縮或想太多', reflect: '讓安靜獨處與交談取得平衡，並把想法寫下來，而不是反覆思考。', missingReflect: '每週安排幾天、每次幾分鐘的安靜時間。', driver: '愛思考、重靈性、內向，追尋真理', destiny: '善於分析、偏內省，帶有靈性興趣' },
  8: { kw: '企圖心、組織力與物質事務', challenge: '過度執著於掌控、地位或工作', reflect: '寫下一個務實的目標，以及支持它的小型預算或規劃習慣。', missingReflect: '嘗試每月檢視一次金錢或目標。', driver: '勤奮認真；有些指南說成功來得較晚', destiny: '有力量與決心，具商業頭腦（與土星相關）' },
  9: { kw: '慈悲、智慧、圓滿與活力', challenge: '急躁、易怒或情緒強烈', reflect: '選擇一個你在乎的理念或小小的服務行動，並調整自己的節奏。', missingReflect: '嘗試一個小小的服務行動，或與人談談價值觀。', driver: '熱情而有力，帶有「戰士」般的能量', destiny: '勇敢、無私、精力充沛；被描述為適合服務他人' },
};

interface ZhLine {
  name: string;
  mean: string;
  emptyName: string;
  emptyMean: string;
  reflect: string;
  complete: string;
}
export const ZH_LINE: Record<string, ZhLine> = {
  'H-492': { name: '心智層面', mean: '思考、記憶與分析', emptyName: '心智層面的弱點箭頭', emptyMean: '記憶不佳、事前規劃不足，或先做後想', reflect: '安排時間閱讀、解謎或學習新事物。', complete: '' },
  'H-357': { name: '情感層面（靈魂層面）', mean: '感受、敏感與直覺', emptyName: '記憶不佳之箭', emptyMean: '記憶零散', reflect: '每天簡短記錄自己的感受與原因。', complete: '' },
  'H-816': { name: '實務層面（物質層面）', mean: '務實行動與把事情做完', emptyName: '損失之箭', emptyMean: '金錢與心力流失', reflect: '把一個目標拆成小步驟，並安排第一步。', complete: '' },
  'V-438': { name: '思考與規劃層面', mean: '規劃與安排想法的能力', emptyName: '猶豫不決之箭', emptyMean: '過度思考、難以有條理', reflect: '為接下來幾個月擬一個簡單的計畫，並每月檢視一次。', complete: '部分來源對此線的別名有分歧。' },
  'V-951': { name: '意志層面', mean: '決心與持之以恆', emptyName: '被動之箭', emptyMean: '等待他人先行動', reflect: '選一個承諾，持續追蹤幾週。', complete: '部分來源對此線的別名有分歧。' },
  'V-276': { name: '行動層面', mean: '把想法化為行動', emptyName: '孤獨之箭', emptyMean: '專注目標但人際連結較少', reflect: '挑一件拖延的小事，今天就做。', complete: '' },
  'D-456': { name: '金線', mean: '務實運用資源的能力', emptyName: '挫折之箭', emptyMean: '壓抑的能量與情緒起伏', reflect: '檢視一個支持你目標的實務習慣（規劃、儲蓄或整理）。', complete: '關於運氣、名聲或財富的說法屬於傳統，沒有證據支持。' },
  'D-258': { name: '銀線', mean: '情緒穩定與耐心', emptyName: '敏感之箭', emptyMean: '非常敏感並隱藏感受', reflect: '嘗試固定的平靜練習，例如短步行或呼吸練習。', complete: '關於房產或財富的說法屬於傳統，沒有證據支持。' },
};

const REPEAT_WORD = { '2': '兩個', '3': '三個', '4PLUS': '四個或以上' } as const;

/** Traditional Chinese reading text for a rule shown in Basic, or undefined if no translation exists. */
export function zhBasicText(rule: InterpretationRule): string | undefined {
  const id = rule.id;
  let m: RegExpExecArray | null;
  if ((m = /^NUM-(\d)-PRESENT$/.exec(id))) return `傳統上與${ZH_DIGIT[Number(m[1]) as Digit].kw}相關。`;
  if ((m = /^NUM-(\d)-MISSING$/.exec(id))) {
    const d = Number(m[1]) as Digit;
    return `傳統上，缺少 ${d} 被視為值得反思「${ZH_DIGIT[d].kw}」的地方，並不代表你欠缺相關的才能、特質或機會。`;
  }
  if ((m = /^NUM-(\d)-REPEATED-(2|3|4PLUS)$/.exec(id))) {
    const d = Number(m[1]) as Digit;
    const z = ZH_DIGIT[d];
    const tier = m[2] as keyof typeof REPEAT_WORD;
    if (tier === '2') return `出現${REPEAT_WORD[tier]} ${d}：傳統上視為「${z.kw}」被強化，通常是正面的強調；若走向極端，可能出現${z.challenge}。`;
    if (tier === '3') return `出現${REPEAT_WORD[tier]} ${d}：有些老師認為此時「${z.kw}」的強調趨於過度，可能表現為${z.challenge}，留意即可。`;
    return `出現${REPEAT_WORD[tier]} ${d}：傳統上視為主導的主題（${z.kw}），需要有意識地調節，因為${z.challenge}可能更明顯。這是反思的提示，不是定論。`;
  }
  if ((m = /^LINE-([HVD]-\d{3})-COMPLETE$/.exec(id))) {
    const l = ZH_LINE[m[1]!]!;
    return `此線完整。傳統上稱為「${l.name}」，與${l.mean}相關。${l.complete}`;
  }
  if ((m = /^LINE-([HVD]-\d{3})-EMPTY$/.exec(id))) {
    const l = ZH_LINE[m[1]!]!;
    return `三個數字都沒有出現。部分來源稱之為「${l.emptyName}」，描述為${l.emptyMean}。傳統上視為值得反思的領域，不是固定特質，也不是預言。`;
  }
  if ((m = /^LINE-([HVD]-\d{3})-PARTIAL-(1|2)$/.exec(id))) {
    const l = ZH_LINE[m[1]!]!;
    return m[2] === '2'
      ? `此線三個數字中出現兩個。部分指南稱為中等或局部成形：與${l.mean}相關的特質被描述為存在但不平均。`
      : `此線三個數字中只出現一個。部分指南稱為較弱：與${l.mean}相關的特質只被描述為輕微強調。`;
  }
  if ((m = /^DRIVER-(\d)$/.exec(id))) {
    const d = Number(m[1]) as Digit;
    return `你的驅動數是 ${d}。在此傳統中，它代表日常性格，描述為：${ZH_DIGIT[d].driver}。請把它當作反思的想法，而不是對你的描述。`;
  }
  if ((m = /^DESTINY-(\d)$/.exec(id))) {
    const d = Number(m[1]) as Digit;
    return `你的命運數是 ${d}。在此傳統中，它與人生的大方向有關，描述為：${ZH_DIGIT[d].destiny}。請把它當作反思的想法，而不是預測。`;
  }
  return undefined;
}

export function zhReflection(rule: InterpretationRule): string | undefined {
  let m: RegExpExecArray | null;
  if ((m = /^NUM-(\d)-(PRESENT|REPEATED-.+)$/.exec(rule.id))) return ZH_DIGIT[Number(m[1]) as Digit].reflect;
  if ((m = /^NUM-(\d)-MISSING$/.exec(rule.id))) return ZH_DIGIT[Number(m[1]) as Digit].missingReflect;
  if ((m = /^LINE-([HVD]-\d{3})-/.exec(rule.id))) return ZH_LINE[m[1]!]?.reflect;
  return undefined;
}

export function zhLineName(lineId: string): string | undefined {
  return ZH_LINE[lineId]?.name;
}

const pair = (id: string) => id.slice(2).split('').join('–');

/** Deterministic Chinese summary built from the same triggered rules as the English one. */
export function zhSummary(report: Report): string[] {
  const { synthesis, analysis: a } = report;
  const out: string[] = [];
  const strengths: string[] = [];
  const reflect: string[] = [];
  for (const t of synthesis.primary) {
    let m: RegExpExecArray | null;
    const id = t.rule.id;
    if ((m = /^NUM-(\d)-REPEATED-(2|3|4PLUS)$/.exec(id))) strengths.push(`${ZH_DIGIT[Number(m[1]) as Digit].kw}被強化（${m[1]} 出現${REPEAT_WORD[m[2] as keyof typeof REPEAT_WORD]}）`);
    else if ((m = /^LINE-([HVD]-\d{3})-COMPLETE$/.exec(id))) strengths.push(`${ZH_LINE[m[1]!]!.name}（${pair(m[1]!)}）完整`);
    else if ((m = /^NUM-(\d)-MISSING$/.exec(id))) reflect.push(`${ZH_DIGIT[Number(m[1]) as Digit].kw}（缺少 ${m[1]}）`);
    else if ((m = /^LINE-([HVD]-\d{3})-EMPTY$/.exec(id))) reflect.push(`${ZH_LINE[m[1]!]!.name}（${pair(m[1]!)}）全空`);
  }
  out.push(strengths.length ? `在此傳統中，這個日期最突出的模式是：${strengths.join('；')}。` : '這個日期沒有完整的線或重複的數字，因此傳統上沒有突出的主導模式。');
  if (reflect.length) out.push(`傳統上，以下是值得反思的領域，而不是固定的弱點：${reflect.join('；')}。`);
  const partial = synthesis.secondary.filter((t) => t.rule.category === 'partial-line').map((t) => `${pair(t.rule.requiredLines[0]!.lineId)} ${t.rule.requiredLines[0]!.presentCount === 2 ? '中等' : '較弱'}`);
  if (partial.length) out.push(`局部成形的線（通用分級）：${partial.join('；')}。`);
  const keys = synthesis.context.filter((t) => t.rule.category === 'driver' || t.rule.category === 'destiny').map((t) => `${t.rule.category === 'driver' ? '驅動數' : '命運數'} ${t.rule.id.split('-')[1]}`);
  if (keys.length) out.push(`關鍵數字：${keys.join('、')}。`);
  if (a.completeLineIds.length === 0) out.push('沒有任何一條線是完整的。');
  if (a.emptyLineIds.length === 0) out.push('沒有任何一條線是完全空的。');
  out.push('以上是傳統解讀，不是對個人的客觀事實。');
  return out;
}

export function zhFrequencyLabel(key: string): string {
  let m: RegExpExecArray | null;
  if ((m = /^complete-([HVD]-\d{3})$/.exec(key))) return `${pair(m[1]!)} 線完整`;
  if ((m = /^empty-([HVD]-\d{3})$/.exec(key))) return `${pair(m[1]!)} 線全空`;
  if ((m = /^repeated-(\d)$/.exec(key))) return `${m[1]} 出現兩次或以上`;
  if ((m = /^missing-count-(\d)$/.exec(key))) return `九個數字中恰好缺少 ${m[1]} 個`;
  if ((m = /^missing-(\d)$/.exec(key))) return `缺少 ${m[1]}`;
  return key;
}

export const ZH_EVIDENCE = '傳統解讀・未經科學驗證';
export const ZH_FIDELITY: Record<string, string> = {
  'directly-documented': '直接有文獻記載',
  'multiple-sources': '多個來源一致',
  'school-specific': '特定流派',
  'sources-disagree': '來源之間有分歧',
  'insufficient-documentation': '來源文件不足',
  'multiple-summaries-agree': '多個搜尋摘要一致（未讀原頁）',
  'unverified-search-summary': '來源未直接核實',
};
export const ZH_CONFIDENCE: Record<string, { short: string; rider: string }> = {
  moderate: { short: '中度信心', rider: '多個搜尋摘要對此想法一致，但原頁未讀，且此解讀仍未經科學驗證。' },
  low: { short: '⚠ 低信心', rider: '低信心：此說法僅依據單一搜尋摘要，或來源之間有分歧、來源不明。請當作反思的想法，而不是關於你的資訊。' },
  'very-low': { short: '⚠ 極低信心', rider: '極低信心：屬預測性或取決於約定的解讀，沒有核實過的來源文本，也沒有科學支持。僅供娛樂與反思。' },
};

/** Chinese versions of the date-validation messages (English is the source of truth in src/loshu/date.ts). */
export function zhDateError(msg: string): string {
  let m: RegExpExecArray | null;
  if (msg.startsWith('Enter a date of birth in DD-MM-YYYY')) return '請以 DD-MM-YYYY 格式輸入出生日期。';
  if (msg.startsWith('This looks like YYYY-MM-DD')) return '這看起來是 YYYY-MM-DD。請以「日在前」的 DD-MM-YYYY 格式輸入日期。';
  if (msg.startsWith('Use exactly DD-MM-YYYY')) return '請使用 DD-MM-YYYY：兩位數的日、兩位數的月與四位數的年（例如 23-11-1994）。';
  if ((m = /^Month (\d+) is not valid/.exec(msg))) return `月份 ${m[1]} 無效。月份為 01 至 12。`;
  if ((m = /^Day (\d+) does not exist in month (\d+) of (\d+) \(that month has (\d+) days\)/.exec(msg))) return `${m[3]} 年 ${m[2]} 月沒有 ${m[1]} 日（該月有 ${m[4]} 天）。`;
  if (msg.startsWith('Dates before 15-10-1582')) return '不支援 1582 年 10 月 15 日（公曆開始）之前的日期。';
  if (msg.startsWith('A date of birth cannot be in the future')) return '出生日期不能是未來的日期。';
  return msg;
}
