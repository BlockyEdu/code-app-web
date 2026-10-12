import { t } from "../lib/i18n";
import type { OfficialSample } from "../lib/official-samples";
import styles from "./SampleCard.module.scss";
import { SampleCover } from "./SampleCover";

interface SampleCardProps {
  sample: OfficialSample;
  onOpen: (slug: string) => void;
}

export function SampleCard({ sample, onOpen }: SampleCardProps) {
  const name = t(sample.nameKey);
  const levelKey = sample.level === "advanced" ? "samples.levelAdvanced" : "samples.levelBeginner";
  return (
    <button type="button" className={styles.card} onClick={() => onOpen(sample.slug)}>
      <SampleCover kind={sample.kind} palette={sample.palette} label={name} />
      <span className={styles.body}>
        <h3 className={styles.title}>{name}</h3>
        <p className={styles.blurb}>{t(sample.blurbKey)}</p>
        <span className={styles.tags}>
          <span className={styles.tag}>{t(levelKey)}</span>
          <span className={styles.tag}>{t("samples.minutes", { count: sample.minutes })}</span>
        </span>
      </span>
      <span className={styles.open}>{t("samples.open")}</span>
    </button>
  );
}
