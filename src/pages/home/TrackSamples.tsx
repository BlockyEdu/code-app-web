import { ArrowRightOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { SampleCard } from "../../components/SampleCard";
import { t } from "../../lib/i18n";
import { navigate } from "../../lib/navigate";
import { officialSamplesByTrack, type SampleTrack } from "../../lib/official-samples";
import { useSiteActions } from "../SiteShell";
import { SectionHead } from "./SectionHead";
import styles from "./TrackSamples.module.scss";

const TRACKS: readonly SampleTrack[] = ["iot", "apps", "basics"];

export function TrackSamples() {
  const { openSample } = useSiteActions();
  const [track, setTrack] = useState<SampleTrack>("iot");
  const rowRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const samples = officialSamplesByTrack(track);

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    setEdges({
      start: row.scrollLeft <= 1,
      end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 1,
    });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the visible track changes
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollLeft = 0;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [track, measure]);

  const scrollBy = (direction: 1 | -1) => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({ left: direction * row.clientWidth * 0.8, behavior: "smooth" });
  };

  const canScroll = !(edges.start && edges.end);

  return (
    <section aria-labelledby="home-tracks-title">
      <SectionHead
        id="home-tracks-title"
        title={t("home.tracks.title")}
        lead={t("home.tracks.lead")}
        actions={
          <Button type="link" className={styles.link} onClick={() => navigate("/samples")}>
            {t("home.tracks.all")}
            <ArrowRightOutlined />
          </Button>
        }
      />
      <div className={styles.bar}>
        <div className={styles.tabs} role="tablist" aria-label={t("home.tracks.title")}>
          {TRACKS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={track === id}
              className={`${styles.tab} ${track === id ? styles.tabOn : ""}`}
              onClick={() => setTrack(id)}
            >
              {t(`home.tracks.${id}`)}
            </button>
          ))}
        </div>
        {canScroll ? (
          <div className={styles.arrows}>
            <Button
              shape="circle"
              size="small"
              icon={<LeftOutlined />}
              disabled={edges.start}
              onClick={() => scrollBy(-1)}
              aria-label="←"
            />
            <Button
              shape="circle"
              size="small"
              icon={<RightOutlined />}
              disabled={edges.end}
              onClick={() => scrollBy(1)}
              aria-label="→"
            />
          </div>
        ) : null}
      </div>
      <ul ref={rowRef} className={styles.row} onScroll={measure} role="tabpanel">
        {samples.map((sample) => (
          <li key={sample.slug} className={styles.item}>
            <SampleCard sample={sample} onOpen={(slug) => openSample(slug)} />
          </li>
        ))}
        <li className={styles.item}>
          <button type="button" className={styles.all} onClick={() => navigate("/samples")}>
            <span className={styles.allIcon}>
              <ArrowRightOutlined />
            </span>
            {t("home.tracks.all")}
          </button>
        </li>
      </ul>
    </section>
  );
}
