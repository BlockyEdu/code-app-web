import { findOfficialSample } from "./official-samples";

type IntentRule = { slug: string | (() => string); pattern: RegExp };

// Prefer the irrigation sample when it is in the catalog.
const irrigationSlug = () => (findOfficialSample("irrigation") ? "irrigation" : "smart-window");

/** First match wins. Order puts specific products before generic words. */
const RULES: readonly IntentRule[] = [
  {
    slug: "news-miniprogram",
    pattern:
      /mini[\s-]?programm?e?s?|miniprograma|miniapp|wechat|小程序|小程式|微信|ミニプログラム|ミニアプリ|미니\s?프로그램|미니앱/,
  },
  {
    slug: "smart-window",
    pattern:
      /\brain|\bwindows?\b|下雨|雨|窗(?![帘簾])|窓|비가|창문|janela|chuva|lluvia|ventana|pioggia|finestra|regen|raam|pluie|fen[eê]tre/,
  },
  {
    slug: irrigationSlug,
    pattern:
      /irrigat|\bsoil\b|\bplants?\b|\bwater(ing)?\b|浇灌|浇水|澆灌|澆水|灌溉|土壤|水やり|灌漑|관개|물주기|riego|\brega\b|\bregar\b|irriga|irrigazione|gie[tß]en|arrosage|arroser/,
  },
  {
    slug: "air-beacon",
    pattern:
      /temperature|humidity|\btemp\b|thermo|esp32|stm32|firmware|\bchips?\b|温度|湿度|温湿度|室温|室溫|溫度|濕度|溫濕度|气温|氣溫|固件|韌體|芯片|晶片|気温|ファームウェア|온도|습도|펌웨어|temperatura|umidade|humedad|umidit|temperatuur|luchtvochtigheid|temp[eé]rature|humidit[eé]/,
  },
  {
    slug: "motion-light",
    pattern:
      /motion|pir|occupancy|人体感应|人体感應|感应灯|感應燈|モーション|인체\s?감지|movimento|presen[cç]a|mouvement/,
  },
  {
    slug: "movie-night",
    pattern:
      /movie|cinema|film\s?night|观影|觀影|看电影|看電影|映画|영화|cine|filme|film\b|cin[eé]ma/,
  },
  {
    slug: "good-night",
    pattern: /good\s?night|bedtime|晚安|睡觉|睡覺|おやすみ|굿나잇|buenas noches|bonne nuit/,
  },
  {
    slug: "living-room",
    pattern:
      /\blights?\b|\blichts?\b|\blamps?\b|curtains?|living\s?room|smart\s?home|mqtt|灯|燈|窗帘|窗簾|家居|客厅|客廳|照明|明かり|あかり|ライト|カーテン|リビング|조명|불을?|커튼|거실|\bluz(es)?\b|\bluces\b|cortina|sala de estar|\bluce\b|\bluci\b|tenda|woonkamer|gordijn|\blampe\b|lumi[eè]re?s?|rideau/,
  },
  {
    slug: "desk-rover",
    pattern:
      /\bcar\b|\bcars\b|rover|vehicle|小车|小車|车|車|クルマ|ローバー|자동차|로버|carrinho|\bcoche\b|\bauto\b|macchinina|\bwagen\b|voiture/,
  },
  {
    slug: "desk-pet",
    pattern:
      /robot|\bpets?\b|\btoys?\b|机器人|機器人|玩具|宠物|寵物|ロボット|おもちゃ|ペット|로봇|장난감|robô|juguete|giocattolo|speelgoed|jouet/,
  },
  {
    slug: "landing-page",
    pattern: /landing|落地页|著陸頁|着陸|랜딩|aterrissagem|aterrizaje/,
  },
  {
    slug: "portfolio",
    pattern: /portfolio|作品集|ポートフォリオ|포트폴리오|portef[oó]lio|portafolio/,
  },
  {
    slug: "blog",
    pattern:
      /blog|web\s?sites?|\bsites?\b|web\s?pages?|网站|网页|網站|網頁|博客|サイト|ブログ|웹사이트|블로그|sitio|\bsito\b|\bsite\b/,
  },
];

export const PROMPT_FALLBACK_SLUG = "pair-exercise";

/** Maps a free-form idea to the closest official sample slug. */
export function sampleSlugForPrompt(text: string): string {
  const normalized = text.normalize("NFKC").toLowerCase();
  for (const rule of RULES) {
    if (rule.pattern.test(normalized)) {
      return typeof rule.slug === "function" ? rule.slug() : rule.slug;
    }
  }
  return PROMPT_FALLBACK_SLUG;
}
