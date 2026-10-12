import { t } from "../../lib/i18n";
import { useLocaleStore } from "../../lib/locale-store";
import type { Readout } from "./map-scene";
import styles from "./stage.module.scss";

function formatValue(item: Readout): string {
  if (item.format === "bool") return item.value > 0 ? t("stage.on") : t("stage.off");
  const unit = item.unitKey ? t(item.unitKey) : "";
  const number = item.value.toFixed(item.digits);
  return unit ? `${number} ${unit}` : number;
}

function barWidth(item: Readout): number {
  const span = item.max - item.min;
  if (span <= 0) return 0;
  const ratio = (item.value - item.min) / span;
  return Math.max(0, Math.min(100, ratio * 100));
}

export function ReadoutStrip({ items }: { items: Readout[] }) {
  useLocaleStore((s) => s.locale);
  return (
    <div className={styles.readout}>
      {items.map((item) => (
        <div key={item.id} className={styles.readoutItem}>
          <span className={styles.readoutLabel}>{t(item.labelKey)}</span>
          <span className={styles.readoutValue}>{formatValue(item)}</span>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${barWidth(item)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
