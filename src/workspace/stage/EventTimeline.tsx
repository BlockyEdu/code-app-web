import { t } from "../../lib/i18n";
import { useLocaleStore } from "../../lib/locale-store";
import type { StageAssertion, StageEvent } from "./map-scene";
import styles from "./stage.module.scss";

export function EventTimeline({
  events,
  assertions,
}: {
  events: StageEvent[];
  assertions: StageAssertion[];
}) {
  useLocaleStore((s) => s.locale);
  return (
    <details className={styles.timeline} open>
      <summary>
        {t("stage.timeline")}
        {assertions.length > 0 ? ` · ${t("stage.assertions")}` : ""}
      </summary>
      <div className={styles.timelineBody}>
        {assertions.length > 0 ? (
          <div className={styles.assertRow}>
            {assertions.map((item) => (
              <span
                key={item.id}
                className={`${styles.dot} ${item.ok ? styles.dotOk : styles.dotBad}`}
                title={`${item.name}: ${item.detail}`}
              >
                <i />
                <span>{item.name}</span>
              </span>
            ))}
          </div>
        ) : null}
        {events.length === 0 ? (
          <div className={styles.empty}>{t("stage.noEvents")}</div>
        ) : (
          events.map((event) => (
            <div key={event.id} className={styles.eventLine} title={event.text}>
              {event.text}
            </div>
          ))
        )}
      </div>
    </details>
  );
}
