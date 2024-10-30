import type { Locale } from "antd/es/locale";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { create } from "zustand";

export type AppLocale = "zh-CN" | "en-US";

const STORAGE_KEY = "blockyedu_ui_locale";

function readStored(): AppLocale {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "en-US" || v === "zh-CN") return v;
  } catch {
    /* ignore */
  }
  return "zh-CN";
}

function antdFor(locale: AppLocale): Locale {
  return locale === "en-US" ? enUS : zhCN;
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
      document.documentElement.lang = locale;
    }
    set({ locale, antdLocale: antdFor(locale) });
  },
}));
