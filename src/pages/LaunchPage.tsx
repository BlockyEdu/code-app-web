import { ArrowLeftOutlined, CodeOutlined } from "@ant-design/icons";
import { Alert, App as AntdApp, Button, Empty, Spin, Tooltip } from "antd";
import { useCallback, useEffect, useState } from "react";
import { AppProviders } from "../components/AppProviders";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { LogoMark } from "../components/Logo";
import { UserAvatarMenu } from "../components/UserAvatarMenu";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";
import { type AppLocale, useLocaleStore } from "../lib/locale-store";
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

const COPY: Record<
  AppLocale,
  {
    projects: string;
    backToProjects: string;
    backToWorkspace: string;
    workspace: string;
    pageTitle: string;
    subtitle: string;
    banner: string;
    missingDesc: string;
    loadFailed: string;
    retry: string;
    dfmTitle: string;
    engine: string;
    gatesPassing: string;
    blocked: string;
    noIssues: string;
    packTitle: string;
    gate: string;
    watermarked: string;
    noFiles: string;
    quoteTitle: string;
    factoryDisabled: string;
    requestQuote: string;
    openVendor: string;
    mode: string;
    launchPackTitle: string;
    generatePack: string;
    readyToSell: string;
    notReady: string;
    downloadMd: string;
    quoteFailed: string;
    packFailed: string;
  }
> = {
  "zh-CN": {
    projects: "项目",
    backToProjects: "返回项目列表",
    backToWorkspace: "返回工作台",
    workspace: "工作台",
    pageTitle: "发布台",
    subtitle: "检查制造就绪度、导出开源制造包。仿真不是量产。",
    banner: "仿真不是量产。工厂下单当前关闭。上架销售须经人工审核。",
    missingDesc: "未指定作品。请从项目列表或工作台进入发布台。",
    loadFailed: "无法加载发布台",
    retry: "重新检查",
    dfmTitle: "可制造性检查（DFM / ERC）",
    engine: "引擎",
    gatesPassing: "检查通过",
    blocked: "未通过",
    noIssues: "暂无问题",
    packTitle: "开源制造包",
    gate: "关卡",
    watermarked: "含水印（未冻结）",
    noFiles: "暂无导出文件",
    quoteTitle: "供应商报价 / 深链",
    factoryDisabled: "当前配置未开放真实工厂下单。",
    requestQuote: "申请 JLCPCB / PCBWay 深链",
    openVendor: "打开供应商",
    mode: "模式",
    launchPackTitle: "上架包（Tindie / Crowd Supply）",
    generatePack: "生成上架包",
    readyToSell: "可上架 — 已记录人工审核",
    notReady: "未达上架条件，清单未完成",
    downloadMd: "下载 Markdown",
    quoteFailed: "报价失败",
    packFailed: "生成上架包失败",
  },
  "en-US": {
    projects: "Projects",
    backToProjects: "Back to projects",
    backToWorkspace: "Back to workspace",
    workspace: "Workspace",
    pageTitle: "Launch desk",
    subtitle:
      "Check manufacturing readiness and export an open pack. Simulation is not mass production.",
    banner:
      "Simulation is not mass production. Factory orders stay off. Ready-to-sell only after human review.",
    missingDesc: "No artifact specified. Open Launch from a project or the workspace.",
    loadFailed: "Failed to load the launch desk",
    retry: "Re-validate",
    dfmTitle: "DFM / ERC (rule engine)",
    engine: "Engine",
    gatesPassing: "Passing",
    blocked: "Blocked",
    noIssues: "No issues",
    packTitle: "Open manufacturing pack",
    gate: "Gate",
    watermarked: "Watermarked (not frozen)",
    noFiles: "No exported files yet",
    quoteTitle: "Vendor quote / deeplink",
    factoryDisabled: "Real factory orders are disabled for this profile.",
    requestQuote: "Request JLCPCB / PCBWay deeplink",
    openVendor: "Open vendor",
    mode: "Mode",
    launchPackTitle: "Launch pack (Tindie / Crowd Supply)",
    generatePack: "Generate pack",
    readyToSell: "Ready to sell — human review recorded.",
    notReady: "Not ready to sell. Checklist incomplete.",
    downloadMd: "Download markdown",
    quoteFailed: "Quote failed",
    packFailed: "Launch pack failed",
  },
};

function LaunchPageInner() {
  const { message } = AntdApp.useApp();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const locale = useLocaleStore((s) => s.locale);
  const t = COPY[locale];
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
      const msg = err instanceof Error ? err.message : t.loadFailed;
      setLoadError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [artifactId, message, openArtifact, t.loadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const name = artifactName || artifactId || "";
    document.title = name ? `${t.pageTitle} · ${name}` : t.pageTitle;
    return () => {
      document.title = "BlockyEdu — Learn, Build, Ship";
    };
  }, [artifactId, artifactName, t.pageTitle]);

  const onQuote = async () => {
    if (!artifactId) return;
    try {
      const q = await api.createManufacturingQuote(artifactId, "deeplink");
      setQuote(q);
    } catch (err) {
      message.error(err instanceof Error ? err.message : t.quoteFailed);
    }
  };

  const onLaunchPack = async () => {
    if (!artifactId) return;
    try {
      const lp = await api.createLaunchPack(artifactId);
      setLaunch(lp);
      track("launch.pack.generated", { artifactId, readyToSell: lp.readyToSell });
    } catch (err) {
      message.error(err instanceof Error ? err.message : t.packFailed);
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
        <Tooltip title={t.backToProjects}>
          <button
            type="button"
            className={styles.hubBtn}
            onClick={goProjects}
            aria-label={t.backToProjects}
          >
            <ArrowLeftOutlined className={styles.backIcon} />
            <LogoMark size={22} />
            <span className={styles.hubLabel}>{t.projects}</span>
          </button>
        </Tooltip>
        <nav className={styles.crumb} aria-label="Breadcrumb">
          <button type="button" className={styles.crumbLink} onClick={goProjects}>
            {t.projects}
          </button>
          <span className={styles.crumbSep} aria-hidden>
            /
          </span>
          {artifactId ? (
            <>
              <button type="button" className={styles.crumbLink} onClick={goWorkspace}>
                {artifactName || t.workspace}
              </button>
              <span className={styles.crumbSep} aria-hidden>
                /
              </span>
            </>
          ) : null}
          <span className={styles.crumbCurrent}>{t.pageTitle}</span>
        </nav>
      </div>
      <div className={styles.actions}>
        {artifactId ? (
          <Button type="primary" icon={<CodeOutlined />} onClick={goWorkspace}>
            {t.backToWorkspace}
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
          <Empty description={t.missingDesc}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={goProjects}>
              {t.backToProjects}
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
          <h1 className={styles.heading}>{t.pageTitle}</h1>
          <p className={styles.lede}>
            {artifactName ? `${artifactName} · ${t.subtitle}` : t.subtitle}
          </p>
        </div>

        <Alert type="warning" showIcon message={t.banner} className={styles.banner} />

        {loading ? (
          <div className={styles.loading}>
            <Spin />
          </div>
        ) : loadError ? (
          <Empty description={loadError}>
            <div className={styles.errorActions}>
              <Button onClick={() => void load()}>{t.retry}</Button>
              <Button type="primary" icon={<CodeOutlined />} onClick={goWorkspace}>
                {t.backToWorkspace}
              </Button>
            </div>
          </Empty>
        ) : (
          <>
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h2>{t.dfmTitle}</h2>
                <span className={report?.ok ? styles.okChip : styles.badChip}>
                  {report?.ok ? t.gatesPassing : t.blocked}
                </span>
              </div>
              <p className={styles.meta}>
                {t.engine}: {report?.engine || "—"}
              </p>
              {(report?.issues ?? []).length === 0 ? (
                <p className={styles.muted}>{t.noIssues}</p>
              ) : (
                <ul>
                  {(report?.issues ?? []).map((issue) => (
                    <li key={issue.code}>
                      [{issue.severity}] {issue.code}: {issue.message}
                    </li>
                  ))}
                </ul>
              )}
              <Button onClick={() => void load()}>{t.retry}</Button>
            </section>

            <section className={styles.card}>
              <h2>{t.packTitle}</h2>
              <p className={styles.meta}>
                {t.gate} {pack?.gate || "—"}
                {pack?.watermark ? ` · ${t.watermarked}` : ""}
              </p>
              {(pack?.files ?? []).length === 0 ? (
                <p className={styles.muted}>{t.noFiles}</p>
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
              <h2>{t.quoteTitle}</h2>
              {!features.canPlaceFactoryOrder && (
                <p className={styles.muted}>{t.factoryDisabled}</p>
              )}
              <Button onClick={() => void onQuote()}>{t.requestQuote}</Button>
              {quote && (
                <p className={styles.meta}>
                  {t.mode}: {quote.mode}
                  {quote.blockedReason ? ` · ${quote.blockedReason}` : ""}
                  {quote.deeplinkUrl ? (
                    <>
                      {" "}
                      ·{" "}
                      <a href={quote.deeplinkUrl} target="_blank" rel="noreferrer">
                        {t.openVendor}
                      </a>
                    </>
                  ) : null}
                </p>
              )}
            </section>

            <section className={styles.card}>
              <h2>{t.launchPackTitle}</h2>
              <Button type="primary" onClick={() => void onLaunchPack()}>
                {t.generatePack}
              </Button>
              {launch && (
                <>
                  {launch.readyToSell ? (
                    <p className={styles.sell}>{t.readyToSell}</p>
                  ) : (
                    <p className={styles.muted}>{t.notReady}</p>
                  )}
                  <ul>
                    {launch.checklist.map((c) => (
                      <li key={c.id}>
                        {c.done ? "✓" : "○"} {c.label}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={downloadMarkdown}>{t.downloadMd}</Button>
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
