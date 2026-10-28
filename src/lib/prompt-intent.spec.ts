import { expect, test } from "@rstest/core";
import { tFor } from "./i18n";
import { APP_LOCALES } from "./locale-store";
import { findOfficialSample } from "./official-samples";
import { PROMPT_FALLBACK_SLUG, sampleSlugForPrompt } from "./prompt-intent";

test("window and rain prompts open the smart window sample", () => {
  expect(sampleSlugForPrompt("Close the window when it rains")).toBe("smart-window");
  expect(sampleSlugForPrompt("下雨自动关窗")).toBe("smart-window");
  expect(sampleSlugForPrompt("Raam dicht als het regent")).toBe("smart-window");
  expect(sampleSlugForPrompt("Fermer la fenêtre quand il pleut")).toBe("smart-window");
});

test("irrigation falls back to the nearest existing sample", () => {
  const expected = findOfficialSample("irrigation") ? "irrigation" : "smart-window";
  expect(sampleSlugForPrompt("Water my plants when the soil is dry")).toBe(expected);
  expect(sampleSlugForPrompt("土壤干了自动浇灌")).toBe(expected);
});

test("sensor prompts map to the air beacon", () => {
  expect(sampleSlugForPrompt("Show room temperature and humidity")).toBe("air-beacon");
  expect(sampleSlugForPrompt("温湿度监测")).toBe("air-beacon");
  expect(sampleSlugForPrompt("ESP32 firmware")).toBe("air-beacon");
});

test("home and device prompts", () => {
  expect(sampleSlugForPrompt("Turn on the living room lights")).toBe("living-room");
  expect(sampleSlugForPrompt("拉上窗帘，打开灯")).toBe("living-room");
  expect(sampleSlugForPrompt("人体感应开灯")).toBe("motion-light");
  expect(sampleSlugForPrompt("movie night dim lights")).toBe("movie-night");
  expect(sampleSlugForPrompt("晚安模式")).toBe("good-night");
  expect(sampleSlugForPrompt("a little car that drives")).toBe("desk-rover");
  expect(sampleSlugForPrompt("做一个小车")).toBe("desk-rover");
  expect(sampleSlugForPrompt("a robot friend")).toBe("desk-pet");
  expect(sampleSlugForPrompt("互动机器人")).toBe("desk-pet");
});

test("web and mini program prompts", () => {
  expect(sampleSlugForPrompt("Build a blog")).toBe("blog");
  expect(sampleSlugForPrompt("我想做一个网站")).toBe("blog");
  expect(sampleSlugForPrompt("a landing page")).toBe("landing-page");
  expect(sampleSlugForPrompt("my portfolio")).toBe("portfolio");
  expect(sampleSlugForPrompt("a news mini program")).toBe("news-miniprogram");
  expect(sampleSlugForPrompt("做个小程序")).toBe("news-miniprogram");
});

test("unknown prompts and unrelated words fall back", () => {
  expect(sampleSlugForPrompt("")).toBe(PROMPT_FALLBACK_SLUG);
  expect(sampleSlugForPrompt("teach me loops")).toBe(PROMPT_FALLBACK_SLUG);
  expect(sampleSlugForPrompt("train a brain")).toBe(PROMPT_FALLBACK_SLUG);
  expect(PROMPT_FALLBACK_SLUG).toBe("pair-exercise");
});

test("every mapped slug is an official sample", () => {
  const prompts = [
    "rain window",
    "soil",
    "temperature",
    "lights",
    "car",
    "robot",
    "landing",
    "portfolio",
    "blog",
    "mini program",
    "hello",
  ];
  for (const prompt of prompts) {
    expect(findOfficialSample(sampleSlugForPrompt(prompt))).not.toBeNull();
  }
});

test("hero example chips map to their sample in every locale", () => {
  const expected = {
    example1: "smart-window",
    example2: "air-beacon",
    example3: "living-room",
    example4: "news-miniprogram",
  } as const;
  for (const locale of APP_LOCALES) {
    for (const [key, slug] of Object.entries(expected)) {
      const text = tFor(locale, `home.hero.${key}`);
      expect(`${locale}:${sampleSlugForPrompt(text)}`).toBe(`${locale}:${slug}`);
    }
  }
});
