import {
  AuditOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  ClusterOutlined,
  ExportOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { t } from "../lib/i18n";
import { coursePlatformUrl, salesContactUrl } from "../lib/site-links";
import styles from "./AboutPage.module.scss";
import { SiteShell } from "./SiteShell";

const ECOSYSTEM = [
  { id: "syncrobrain", icon: <ClusterOutlined />, tone: "teal" },
  { id: "vistacast", icon: <VideoCameraOutlined />, tone: "violet" },
  { id: "dataluminary", icon: <BarChartOutlined />, tone: "amber" },
] as const;

const POINTS = [
  { id: "classroom", icon: <AuditOutlined /> },
  { id: "private", icon: <CloudServerOutlined /> },
  { id: "export", icon: <ExportOutlined /> },
] as const;

export function AboutPage() {
  return (
    <SiteShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("about.title")}</h1>
          <p className={styles.lead}>{t("about.lead")}</p>
        </header>

        <section className={styles.mission} aria-labelledby="about-mission">
          <h2 id="about-mission" className={styles.h2}>
            {t("about.missionTitle")}
          </h2>
          <p className={styles.body}>{t("about.missionBody")}</p>
        </section>

        <section aria-labelledby="about-eco">
          <div className={styles.head}>
            <h2 id="about-eco" className={styles.h2}>
              {t("about.ecoTitle")}
            </h2>
            <p className={styles.sub}>{t("about.ecoLead")}</p>
          </div>
          <ul className={styles.eco}>
            {ECOSYSTEM.map((item) => (
              <li key={item.id} className={styles.ecoCard}>
                <span className={`${styles.ecoIcon} ${styles[item.tone]}`}>{item.icon}</span>
                <h3 className={styles.ecoName}>{t(`about.eco.${item.id}.name`)}</h3>
                <p className={styles.ecoLine}>{t(`about.eco.${item.id}.line`)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.orgs} aria-labelledby="about-orgs">
          <div className={styles.head}>
            <h2 id="about-orgs" className={styles.h2}>
              {t("about.orgs.title")}
            </h2>
            <p className={styles.sub}>{t("about.orgs.lead")}</p>
          </div>
          <ul className={styles.points}>
            {POINTS.map((point) => (
              <li key={point.id} className={styles.point}>
                <span className={styles.pointIcon}>{point.icon}</span>
                <div className={styles.pointCopy}>
                  <h3 className={styles.pointTitle}>{t(`about.orgs.${point.id}Title`)}</h3>
                  <p className={styles.pointBody}>{t(`about.orgs.${point.id}Body`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            <Button size="large" href={salesContactUrl()}>
              {t("about.contact")}
            </Button>
            <Button
              size="large"
              type="primary"
              href={coursePlatformUrl()}
              target="_blank"
              rel="noreferrer"
            >
              {t("about.coursePlatform")}
            </Button>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
