import { lazy, Suspense } from "react";
import { t } from "../lib/i18n";
import styles from "./HomePage.module.scss";
import { CapabilityMap } from "./home/CapabilityMap";
import { Hero } from "./home/Hero";
import { LearningPath } from "./home/LearningPath";
import { ModesSection } from "./home/ModesSection";
import { TrackSamples } from "./home/TrackSamples";
import { SiteShell } from "./SiteShell";

const ChainDemo = lazy(() => import("./home/ChainDemo"));

export function HomePage({ trial = false }: { trial?: boolean }) {
  return (
    <SiteShell trial={trial}>
      <div className={styles.page}>
        <div className={styles.top}>
          <Hero />
          <Suspense
            fallback={
              <div
                className={styles.demoFallback}
                role="status"
                aria-label={t("home.chain.loading")}
              />
            }
          >
            <ChainDemo />
          </Suspense>
        </div>
        <ModesSection />
        <CapabilityMap />
        <TrackSamples />
        <LearningPath />
      </div>
    </SiteShell>
  );
}
