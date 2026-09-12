import en from "../../public/locales/en/common.json";
import zh from "../../public/locales/zh/common.json";
import { useLocaleStore } from "./locale-store";

export type AppLocale = "en" | "zh";

type Dict = Record<string, unknown>;

function lookup(dict: Dict, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const part of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Dict)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function getLocale(): AppLocale {
  const ui = useLocaleStore.getState().locale;
  if (ui === "en-US") return "en";
  if (ui === "zh-CN") return "zh";
  if (typeof window === "undefined") return "zh";
  const stored = window.localStorage.getItem("blockyedu_locale");
  if (stored === "en" || stored === "zh") return stored;
  return window.navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const locale = getLocale();
  const dict = (locale === "en" ? en : zh) as Dict;
  let value = lookup(dict, key) ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{{${name}}}`, String(replacement));
    }
  }
  return value;
}

export function flattenLocaleKeys(dict: unknown, prefix = ""): string[] {
  if (!dict || typeof dict !== "object") return [];
  const out: string[] = [];
  for (const [key, value] of Object.entries(dict as Dict)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") out.push(...flattenLocaleKeys(value, next));
    else out.push(next);
  }
  return out;
}

export const EN_COMMON = en;
export const ZH_COMMON = zh;
