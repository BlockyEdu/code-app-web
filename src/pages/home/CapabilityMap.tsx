import {
  ApiOutlined,
  AppstoreOutlined,
  HddOutlined,
  RobotOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { t } from "../../lib/i18n";
import styles from "./CapabilityMap.module.scss";
import { SectionHead } from "./SectionHead";

type Status = "available" | "beta" | "planned";

type Item = { id: string; status: Status; note?: string };

type Layer = { id: string; icon: ReactNode; items: Item[] };

const LAYERS: Layer[] = [
  {
    id: "chips",
    icon: <HddOutlined />,
    items: [
      { id: "esp32s3", status: "available", note: "home.caps.noteSimulation" },
      { id: "esp32c3", status: "available" },
      { id: "stm32", status: "available" },
      { id: "sensors", status: "available" },
    ],
  },
  {
    id: "comm",
    icon: <ApiOutlined />,
    items: [
      { id: "mqtt", status: "beta", note: "home.caps.noteBrowser" },
      { id: "kit", status: "planned" },
      { id: "ota", status: "planned" },
    ],
  },
  {
    id: "apps",
    icon: <AppstoreOutlined />,
    items: [
      { id: "websites", status: "available" },
      { id: "miniprograms", status: "available" },
      { id: "host", status: "planned" },
    ],
  },
  {
    id: "vision",
    icon: <VideoCameraOutlined />,
    items: [{ id: "camera", status: "planned" }],
  },
  {
    id: "ai",
    icon: <RobotOutlined />,
    items: [
      { id: "aiGenerate", status: "available" },
      { id: "aiExplain", status: "available" },
      { id: "aiDebug", status: "available" },
    ],
  },
];

export function CapabilityMap() {
  return (
    <section aria-labelledby="home-caps-title">
      <SectionHead id="home-caps-title" title={t("home.caps.title")} lead={t("home.caps.lead")} />
      <div className={styles.map}>
        {LAYERS.map((layer) => (
          <div key={layer.id} className={styles.row}>
            <div className={styles.layer}>
              <span className={styles.layerIcon}>{layer.icon}</span>
              {t(`home.caps.layers.${layer.id}`)}
            </div>
            <ul className={styles.items}>
              {layer.items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <span className={styles.name}>{t(`home.caps.items.${item.id}`)}</span>
                  <span className={styles.meta}>
                    <span className={`${styles.badge} ${styles[item.status]}`}>
                      <i />
                      {t(`home.caps.${item.status}`)}
                    </span>
                    {item.note ? <span className={styles.note}>{t(item.note)}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
