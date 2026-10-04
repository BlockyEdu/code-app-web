import type { Locale } from "antd/es/locale";
import enUS from "antd/locale/en_US";
import esES from "antd/locale/es_ES";
import frFR from "antd/locale/fr_FR";
import itIT from "antd/locale/it_IT";
import jaJP from "antd/locale/ja_JP";
import koKR from "antd/locale/ko_KR";
import nlNL from "antd/locale/nl_NL";
import ptPT from "antd/locale/pt_PT";
import zhCN from "antd/locale/zh_CN";
import zhTW from "antd/locale/zh_TW";
import { create } from "zustand";

export const APP_LOCALES = [
  "zh-CN",
  "zh-TW",
  "ja",
  "ko",
  "en",
  "pt",
  "nl",
  "it",
  "es",
  "fr",
] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const LOCALE_LABELS: Record<AppLocale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ja: "日本語",
  ko: "한국어",
  en: "English",
  pt: "Português",
  nl: "Nederlands",
  it: "Italiano",
  es: "Español",
  fr: "Français",
};

const STORAGE_KEY = "blockyedu_ui_locale";

export function normalizeAppLocale(value: string | null | undefined): AppLocale | null {
  if (!value) return null;
  if (value === "en-US") return "en";
  if (value === "zh") return "zh-CN";
  return (APP_LOCALES as readonly string[]).includes(value) ? (value as AppLocale) : null;
}

function readStored(): AppLocale {
  try {
    return normalizeAppLocale(localStorage.getItem(STORAGE_KEY)) ?? "zh-CN";
  } catch {
    return "zh-CN";
  }
}

function antdFor(locale: AppLocale): Locale {
  switch (locale) {
    case "zh-CN":
      return zhCN;
    case "zh-TW":
      return zhTW;
    case "ja":
      return jaJP;
    case "ko":
      return koKR;
    case "en":
      return enUS;
    case "pt":
      return ptPT;
    case "nl":
      return nlNL;
    case "it":
      return itIT;
    case "es":
      return esES;
    case "fr":
      return frFR;
    default: {
      const unexpected: never = locale;
      return unexpected;
    }
  }
}

interface LocaleState {
  locale: AppLocale;
  antdLocale: Locale;
  setLocale: (locale: AppLocale) => void;
}

const initial = typeof window !== "undefined" ? readStored() : ("zh-CN" as AppLocale);

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: initial,
  antdLocale: antdFor(initial),
  setLocale: (locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "en" ? "en" : locale;
    }
    set({ locale, antdLocale: antdFor(locale) });
  },
}));
