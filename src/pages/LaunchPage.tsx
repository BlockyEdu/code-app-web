import { ArrowLeftOutlined } from "@ant-design/icons";
import { App as AntdApp, Button, Spin } from "antd";
import { useCallback, useEffect, useState } from "react";
import { AppProviders } from "../components/AppProviders";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { LogoMark } from "../components/Logo";
import { UserAvatarMenu } from "../components/UserAvatarMenu";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";
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
  const features = profileFeatures();
  const artifactId = parseLaunchArtifactId();
  const openArtifact = useWorkspaceStore((s) => s.openArtifact);
  const artifactName = useWorkspaceStore((s) => s.artifactName);

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ValidateReport | null>(null);
  const [pack, setPack] = useState<Pack | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [launch, setLaunch] = useState<LaunchPack | null>(null);

  const load = useCallback(async () => {
    if (!artifactId) return;
    setLoading(true);
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
      message.error(err instanceof Error ? err.message : "Failed to load manufacturing desk");
    } finally {
      setLoading(false);
    }
  }, [artifactId, message, openArtifact]);

  useEffect(() => {
    void load();
  }, [load]);

  const onQuote = async () => {
    if (!artifactId) return;
    try {
      const q = await api.createManufacturingQuote(artifactId, "deeplink");
      setQuote(q);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Quote failed");
    }
  };

  const onLaunchPack = async () => {
    if (!artifactId) return;
    try {
      const lp = await api.createLaunchPack(artifactId);
      setLaunch(lp);
      track("launch.pack.generated", { artifactId, readyToSell: lp.readyToSell });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Launch pack failed");
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

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button type="button" className={styles.back} onClick={() => navigate("/")}>
          <LogoMark size={22} />
          <span>Hub</span>
        </button>
        <strong className={styles.title}>Launch desk · {artifactName || artifactId}</strong>
        <div className={styles.actions}>
          <LocaleSwitcher />
          {user && <UserAvatarMenu user={user} onLogout={logout} />}
        </div>
      </header>

      <main className={styles.main}>
        <p className={styles.banner}>
          Simulation is not mass production. Factory orders stay off. Ready-to-sell only after human
          review.
        </p>
        {loading ? (
          <Spin />
        ) : (
          <>
            <section className={styles.card}>
              <h2>DFM / ERC (rule engine)</h2>
              <p>
                Engine: {report?.engine || "—"} · {report?.ok ? "gates passing" : "blocked"}
              </p>
              <ul>
                {(report?.issues ?? []).map((issue) => (
                  <li key={issue.code}>
                    [{issue.severity}] {issue.code}: {issue.message}
                  </li>
                ))}
              </ul>
              <Button onClick={() => void load()}>Re-validate</Button>
            </section>

            <section className={styles.card}>
              <h2>Open manufacturing pack</h2>
              <p>
                Gate {pack?.gate || "—"}
                {pack?.watermark ? " · watermarked (not frozen)" : ""}
              </p>
              <ul>
                {(pack?.files ?? []).map((f) => (
                  <li key={f.path}>
                    {f.path} <span className={styles.muted}>({f.kind})</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => artifactId && navigate(`/workspace/${artifactId}`)}
                icon={<ArrowLeftOutlined />}
              >
                Back to firmware
              </Button>
            </section>

            <section className={styles.card}>
              <h2>Vendor quote / deeplink</h2>
              {!features.canPlaceFactoryOrder && (
                <p className={styles.muted}>Real factory orders are disabled for this profile.</p>
              )}
              <Button onClick={() => void onQuote()}>Request JLCPCB / PCBWay deeplink</Button>
              {quote && (
                <p>
                  Mode: {quote.mode}
                  {quote.blockedReason ? ` · ${quote.blockedReason}` : ""}
                  {quote.deeplinkUrl ? (
                    <>
                      {" "}
                      ·{" "}
                      <a href={quote.deeplinkUrl} target="_blank" rel="noreferrer">
                        Open vendor
                      </a>
                    </>
                  ) : null}
                </p>
              )}
            </section>

            <section className={styles.card}>
              <h2>Launch Pack (Tindie / Crowd Supply)</h2>
              <Button type="primary" onClick={() => void onLaunchPack()}>
                Generate pack
              </Button>
              {launch && (
                <>
                  {launch.readyToSell ? (
                    <p className={styles.sell}>Ready to sell — human review recorded.</p>
                  ) : (
                    <p className={styles.muted}>Not ready to sell. Checklist incomplete.</p>
                  )}
                  <ul>
                    {launch.checklist.map((c) => (
                      <li key={c.id}>
                        {c.done ? "✓" : "○"} {c.label}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={downloadMarkdown}>Download markdown</Button>
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
