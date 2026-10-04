import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { InterpretationRule } from '../data/schema';
import { zhBasicText, zhReflection } from './zh';

export type Lang = 'en' | 'zh-TW';

interface LangValue {
  lang: Lang;
  isZh: boolean;
  /** Returns the Traditional Chinese text when that language is selected and one is provided; English otherwise. */
  tr: (en: string, zh?: string) => string;
}

const make = (lang: Lang): LangValue => ({ lang, isZh: lang === 'zh-TW', tr: (en, zh) => (lang === 'zh-TW' && zh !== undefined ? zh : en) });

const Ctx = createContext<LangValue>(make('en'));

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <Ctx.Provider value={make(lang)}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

/** Rule text for the Basic tab in the selected language (falls back to English when no translation exists). */
export function useRuleText() {
  const { isZh } = useLang();
  return {
    basic: (r: InterpretationRule) => (isZh ? zhBasicText(r) ?? r.basicText : r.basicText),
    reflection: (r: InterpretationRule) => (isZh ? zhReflection(r) ?? r.reflectionSuggestion : r.reflectionSuggestion),
  };
}

export const ZH_POSITION: Record<string, string> = {
  'top left': '左上', 'top centre': '上中', 'top right': '右上', 'middle left': '左中', centre: '中央',
  'middle right': '右中', 'bottom left': '左下', 'bottom centre': '下中', 'bottom right': '右下',
};
