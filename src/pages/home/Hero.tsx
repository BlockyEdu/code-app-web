import {
  ArrowRightOutlined,
  BulbOutlined,
  CloudOutlined,
  LineChartOutlined,
  MobileOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { type FormEvent, type KeyboardEvent, type ReactNode, useState } from "react";
import { t } from "../../lib/i18n";
import { navigate } from "../../lib/navigate";
import { sampleSlugForPrompt } from "../../lib/prompt-intent";
import { useSiteActions } from "../SiteShell";
import styles from "./Hero.module.scss";

const EXAMPLES: ReadonlyArray<{ key: string; icon: ReactNode }> = [
  { key: "home.hero.example1", icon: <CloudOutlined /> },
  { key: "home.hero.example2", icon: <LineChartOutlined /> },
  { key: "home.hero.example3", icon: <BulbOutlined /> },
  { key: "home.hero.example4", icon: <MobileOutlined /> },
];

export function Hero() {
  const { openSample } = useSiteActions();
  const [text, setText] = useState("");

  const start = (value: string) => {
    const prompt = value.trim();
    if (!prompt) return;
    openSample(sampleSlugForPrompt(prompt), prompt);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    start(text);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    start(text);
  };

  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <h1 id="home-hero-title" className={styles.title}>
        {t("home.hero.title")}
      </h1>
      <p className={styles.sub}>{t("home.hero.sub")}</p>
      <form className={styles.prompt} onSubmit={onSubmit}>
        <textarea
          className={styles.input}
          rows={2}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("home.hero.placeholder")}
          aria-label={t("home.hero.promptLabel")}
        />
        <div className={styles.promptBar}>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            icon={<ArrowRightOutlined />}
            iconPlacement="end"
            disabled={!text.trim()}
          >
            {t("home.hero.submit")}
          </Button>
        </div>
      </form>
      <ul className={styles.chips} aria-label={t("home.hero.examplesLabel")}>
        {EXAMPLES.map((example) => {
          const label = t(example.key);
          return (
            <li key={example.key}>
              <button type="button" className={styles.chip} onClick={() => start(label)}>
                <span className={styles.chipIcon}>{example.icon}</span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
      <Button type="link" className={styles.browse} onClick={() => navigate("/samples")}>
        {t("site.browseSamples")}
        <ArrowRightOutlined />
      </Button>
    </section>
  );
}
