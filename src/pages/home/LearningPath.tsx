import { t } from "../../lib/i18n";
import { coursePlatformUrl } from "../../lib/site-links";
import { useSiteActions } from "../SiteShell";
import styles from "./LearningPath.module.scss";
import { SectionHead } from "./SectionHead";

const STEPS = [
  { id: "s1", slug: "pair-exercise" },
  { id: "s2", slug: "pair-exercise" },
  { id: "s3", slug: "air-beacon" },
  { id: "s4", slug: "smart-window" },
  { id: "s5", slug: "news-miniprogram" },
] as const;

export function LearningPath() {
  const { openSample } = useSiteActions();
  return (
    <section aria-labelledby="home-path-title">
      <SectionHead id="home-path-title" title={t("home.path.title")} lead={t("home.path.lead")} />
      <ol className={styles.path}>
        {STEPS.map((step, index) => (
          <li key={step.id} className={styles.step}>
            <span className={styles.num} aria-hidden="true">
              {index + 1}
            </span>
            <h3 className={styles.title}>
              <span className={styles.sr}>{t("home.path.stepLabel", { n: index + 1 })}: </span>
              {t(`home.path.${step.id}.title`)}
            </h3>
            <p className={styles.body}>{t(`home.path.${step.id}.body`)}</p>
            <div className={styles.links}>
              <button type="button" className={styles.open} onClick={() => openSample(step.slug)}>
                {t("home.path.open")}
              </button>
              <a
                className={styles.course}
                href={coursePlatformUrl()}
                target="_blank"
                rel="noreferrer"
              >
                {t("home.path.course")}
              </a>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
