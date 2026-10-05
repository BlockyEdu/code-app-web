import en from "../../public/locales/en/common.json";
import es from "../../public/locales/es/common.json";
import fr from "../../public/locales/fr/common.json";
import it from "../../public/locales/it/common.json";
import ja from "../../public/locales/ja/common.json";
import ko from "../../public/locales/ko/common.json";
import nl from "../../public/locales/nl/common.json";
import pt from "../../public/locales/pt/common.json";
import zh from "../../public/locales/zh/common.json";
import zhTW from "../../public/locales/zh-TW/common.json";
import { type AppLocale, useLocaleStore } from "./locale-store";

type Dict = Record<string, unknown>;

function catalog(locale: AppLocale): Dict {
  switch (locale) {
    case "zh-CN":
      return zh as Dict;
    case "zh-TW":
      return zhTW as Dict;
    case "ja":
      return ja as Dict;
    case "ko":
      return ko as Dict;
    case "pt":
      return pt as Dict;
    case "nl":
      return nl as Dict;
    case "it":
      return it as Dict;
    case "es":
      return es as Dict;
    case "fr":
      return fr as Dict;
    case "en":
      return en as Dict;
    default: {
      const unexpected: never = locale;
      return unexpected;
    }
  }
}

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
  return useLocaleStore.getState().locale;
}

export function tFor(
  locale: AppLocale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let value = lookup(catalog(locale), key) ?? lookup(en as Dict, key) ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{{${name}}}`, String(replacement));
    }
  }
  return value;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  return tFor(getLocale(), key, vars);
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
export const FR_COMMON = fr;
