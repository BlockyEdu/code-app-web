import { ArrowLeftOutlined, CodeOutlined } from "@ant-design/icons";
import { Alert, App as AntdApp, Button, Empty, Spin, Tooltip } from "antd";
import { useCallback, useEffect, useState } from "react";
import { AppProviders } from "../components/AppProviders";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { LogoMark } from "../components/Logo";
import { UserAvatarMenu } from "../components/UserAvatarMenu";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { navigate, parseLaunchArtifactId } from "../lib/navigate";
import { profileFeatures } from "../lib/product-profile";
import { track } from "../lib/telemetry";
import { useWorkspaceStore } from "../stores/workspace";
import styles from "./LaunchPage.module.scss";

type ValidateReport = {
  ok: boolean;
  engine: string;
  issues: Array<{ severity: string; code: string; message: string }>;
};

type Pack = {
  artifactId: string;
  gate: string;
  watermark: boolean;
  files: Array<{ path: string; kind: string }>;
};

type Quote = {
  id: string;
  mode: string;
  deeplinkUrl?: string;
  blockedReason?: string;
  amountUsd?: number;
};

type LaunchPack = {
  artifactId: string;
  readyToSell: boolean;
  channels: string[];
  checklist: Array<{ id: string; label: string; done: boolean }>;
  markdown: string;
};

function LaunchPageInner() {
  const { message } = AntdApp.useApp();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  useLocaleStore((s) => s.locale);
  const features = profileFeatures();
  const artifactId = parseLaunchArtifactId();
  const openArtifact = useWorkspaceStore((s) => s.openArtifact);
  const artifactName = useWorkspaceStore((s) => s.artifactName);

  const [loading, setLoading] = useState(Boolean(artifactId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [report, setReport] = useState<ValidateReport | null>(null);
  const [pack, setPack] = useState<Pack | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [launch, setLaunch] = useState<LaunchPack | null>(null);

  const goProjects = () => navigate("/");
  const goWorkspace = () => {
    if (artifactId) navigate(`/workspace/${artifactId}`);
    else navigate("/");
  };

  const load = useCallback(async () => {
    if (!artifactId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      await openArtifact(artifactId);
      const [v, p] = await Promise.all([
        api.validateManufacturing(artifactId),
        api.getManufacturingPack(artifactId),
      ]);
      setReport(v);
      setPack(p);
      track("mfg.validate.completed", { artifactId, ok: v.ok, engine: v.engine });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("desk.loadFailed");
      setLoadError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [artifactId, message, openArtifact]);

  useEffect(() => {
    void load();
  }, [load]);

  const pageTitle = t("desk.pageTitle");
  useEffect(() => {
    const name = artifactName || artifactId || "";
    document.title = name ? `${pageTitle} · ${name}` : pageTitle;
    return () => {
      document.title = "BlockyEdu — Learn, Build, Ship";
    };
  }, [artifactId, artifactName, pageTitle]);

  const onQuote = async () => {
    if (!artifactId) return;
    try {
      const q = await api.createManufacturingQuote(artifactId, "deeplink");
      setQuote(q);
    } catch (err) {
      message.error(err instanceof Error ? err.message : t("desk.quoteFailed"));
    }
  };

  const onLaunchPack = async () => {
    if (!artifactId) return;
    try {
      const lp = await api.createLaunchPack(artifactId);
      setLaunch(lp);
      track("launch.pack.generated", { artifactId, readyToSell: lp.readyToSell });
    } catch (err) {
      message.error(err instanceof Error ? err.message : t("desk.packFailed"));
    }
  };

  const downloadMarkdown = () => {
    if (!launch) return;
    const blob = new Blob([launch.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `launch-pack-${artifactId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const header = (
    <header className={styles.topBar}>
      <div className={styles.headerLeft}>
        <Tooltip title={t("desk.backToProjects")}>
          <button
            type="button"
            className={styles.hubBtn}
            onClick={goProjects}
            aria-label={t("desk.backToProjects")}
          >
            <ArrowLeftOutlined className={styles.backIcon} />
            <LogoMark size={22} />
            <span className={styles.hubLabel}>{t("desk.projects")}</span>
          </button>
        </Tooltip>
        <nav className={styles.crumb} aria-label="Breadcrumb">
          <button type="button" className={styles.crumbLink} onClick={goProjects}>
            {t("desk.projects")}
          </button>
          <span className={styles.crumbSep} aria-hidden>
            /
          </span>
          {artifactId ? (
            <>
              <button type="button" className={styles.crumbLink} onClick={goWorkspace}>
                {artifactName || t("desk.workspace")}
              </button>
              <span className={styles.crumbSep} aria-hidden>
                /
              </span>
            </>
          ) : null}
          <span className={styles.crumbCurrent}>{t("desk.pageTitle")}</span>
        </nav>
      </div>
      <div className={styles.actions}>
        {artifactId ? (
          <Button type="primary" icon={<CodeOutlined />} onClick={goWorkspace}>
            {t("desk.backToWorkspace")}
          </Button>
        ) : null}
        <LocaleSwitcher />
        {user && <UserAvatarMenu user={user} onLogout={logout} />}
      </div>
    </header>
  );

  if (!artifactId) {
    return (
      <div className={styles.page}>
        {header}
        <main className={styles.main}>
          <Empty description={t("desk.missingDesc")}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={goProjects}>
              {t("desk.backToProjects")}
            </Button>
          </Empty>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {header}

      <main className={styles.main}>
        <div className={styles.pageHead}>
          <h1 className={styles.heading}>{t("desk.pageTitle")}</h1>
          <p className={styles.lede}>
            {artifactName ? `${artifactName} · ${t("desk.subtitle")}` : t("desk.subtitle")}
          </p>
        </div>

        <Alert type="warning" showIcon message={t("desk.banner")} className={styles.banner} />

        {loading ? (
          <div className={styles.loading}>
            <Spin />
          </div>
        ) : loadError ? (
          <Empty description={loadError}>
            <div className={styles.errorActions}>
              <Button onClick={() => void load()}>{t("desk.retry")}</Button>
              <Button type="primary" icon={<CodeOutlined />} onClick={goWorkspace}>
                {t("desk.backToWorkspace")}
              </Button>
            </div>
          </Empty>
        ) : (
          <>
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h2>{t("desk.dfmTitle")}</h2>
                <span className={report?.ok ? styles.okChip : styles.badChip}>
                  {report?.ok ? t("desk.gatesPassing") : t("desk.blocked")}
                </span>
              </div>
              <p className={styles.meta}>
                {t("desk.engine")}: {report?.engine || "—"}
              </p>
              {(report?.issues ?? []).length === 0 ? (
                <p className={styles.muted}>{t("desk.noIssues")}</p>
              ) : (
                <ul>
                  {(report?.issues ?? []).map((issue) => (
                    <li key={issue.code}>
                      [{issue.severity}] {issue.code}: {issue.message}
                    </li>
                  ))}
                </ul>
              )}
              <Button onClick={() => void load()}>{t("desk.retry")}</Button>
            </section>

            <section className={styles.card}>
              <h2>{t("desk.packTitle")}</h2>
              <p className={styles.meta}>
                {t("desk.gate")} {pack?.gate || "—"}
                {pack?.watermark ? ` · ${t("desk.watermarked")}` : ""}
              </p>
              {(pack?.files ?? []).length === 0 ? (
                <p className={styles.muted}>{t("desk.noFiles")}</p>
              ) : (
                <ul>
                  {(pack?.files ?? []).map((f) => (
                    <li key={f.path}>
                      {f.path} <span className={styles.muted}>({f.kind})</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.card}>
              <h2>{t("desk.quoteTitle")}</h2>
              {!features.canPlaceFactoryOrder && (
                <p className={styles.muted}>{t("desk.factoryDisabled")}</p>
              )}
              <Button onClick={() => void onQuote()}>{t("desk.requestQuote")}</Button>
              {quote && (
                <p className={styles.meta}>
                  {t("desk.mode")}: {quote.mode}
                  {quote.blockedReason ? ` · ${quote.blockedReason}` : ""}
                  {quote.deeplinkUrl ? (
                    <>
                      {" "}
                      ·{" "}
                      <a href={quote.deeplinkUrl} target="_blank" rel="noreferrer">
                        {t("desk.openVendor")}
                      </a>
                    </>
                  ) : null}
                </p>
              )}
            </section>

            <section className={styles.card}>
              <h2>{t("desk.launchPackTitle")}</h2>
              <Button type="primary" onClick={() => void onLaunchPack()}>
                {t("desk.generatePack")}
              </Button>
              {launch && (
                <>
                  {launch.readyToSell ? (
                    <p className={styles.sell}>{t("desk.readyToSell")}</p>
                  ) : (
                    <p className={styles.muted}>{t("desk.notReady")}</p>
                  )}
                  <ul>
                    {launch.checklist.map((c) => (
                      <li key={c.id}>
                        {c.done ? "✓" : "○"} {c.label}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={downloadMarkdown}>{t("desk.downloadMd")}</Button>
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export function LaunchPage() {
  return (
    <AppProviders>
      <LaunchPageInner />
    </AppProviders>
  );
}
