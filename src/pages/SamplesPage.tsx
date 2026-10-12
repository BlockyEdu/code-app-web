import { useEffect, useState } from "react";
import { SampleCard } from "../components/SampleCard";
import { t } from "../lib/i18n";
import { navigate, parseSamplesCategory, samplesPath } from "../lib/navigate";
import {
  filterOfficialSamples,
  SAMPLE_CHIP_IDS,
  type SampleChipId,
  sampleChipSelected,
} from "../lib/official-samples";
import styles from "./SamplesPage.module.scss";
import { SiteShell, useSiteActions } from "./SiteShell";

const CHIP_KEY: Record<SampleChipId, string> = {
  web: "samples.categoryWeb",
  miniprogram: "samples.categoryMiniprogram",
  smarthome: "samples.categorySmarthome",
  iot: "samples.categoryIot",
  basics: "samples.categoryBasics",
};

function useSearch(): string {
  const [search, setSearch] = useState(() => window.location.search);
  useEffect(() => {
    const sync = () => setSearch(window.location.search);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  return search;
}

export function SamplesPage() {
  return (
    <SiteShell>
      <SamplesMain />
    </SiteShell>
  );
}

function SamplesMain() {
  const { openSample } = useSiteActions();
  const search = useSearch();
  const category = parseSamplesCategory(search);
  const samples = filterOfficialSamples(category);

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.lead}>{t("samples.lead")}</h1>
        <div className={styles.chips} role="tablist" aria-label={t("samples.title")}>
          <Chip id="all" label={t("samples.categoryAll")} category={category} />
          {SAMPLE_CHIP_IDS.map((id) => (
            <Chip key={id} id={id} label={t(CHIP_KEY[id])} category={category} />
          ))}
        </div>
      </div>
      {samples.length === 0 ? (
        <p className={styles.empty}>{t("samples.empty")}</p>
      ) : (
        <div className={styles.grid}>
          {samples.map((sample) => (
            <SampleCard key={sample.slug} sample={sample} onOpen={openSample} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  id,
  label,
  category,
}: {
  id: "all" | SampleChipId;
  label: string;
  category: string | null;
}) {
  const on = sampleChipSelected(id, category);
  return (
    <button
      type="button"
      role="tab"
      aria-selected={on}
      className={`${styles.chip} ${on ? styles.chipOn : ""}`}
      onClick={() => navigate(samplesPath(id === "all" ? null : id))}
    >
      {label}
    </button>
  );
}
