import { CopyOutlined, DownloadOutlined, LinkOutlined } from "@ant-design/icons";
import { Button, Input, Modal, message, QRCode } from "antd";
import { useEffect, useState } from "react";
import { type AppValidateReport, api, type WebRelease } from "../lib/api";
import { usesHostedPosts } from "../lib/app-studio/app-schema";
import { errorCodeOf } from "../lib/http";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { useWorkspaceStore } from "../stores/workspace";
import styles from "./BlogStudio.module.scss";

interface PublishWebDialogProps {
  open: boolean;
  onClose: () => void;
}

function resolvePublicHref(publicUrl: string | undefined | null): string | null {
  if (!publicUrl) return null;
  if (publicUrl.startsWith("http")) return publicUrl;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${publicUrl}`;
}

function releaseIsLive(rel: WebRelease, liveReleaseId: string | undefined): boolean {
  return rel.status === "live" || (Boolean(liveReleaseId) && rel.id === liveReleaseId);
}

function releaseErrorCode(rel: WebRelease): string | null {
  if (rel.errorCode) return rel.errorCode;
  if (rel.status === "failed") return rel.status;
  return null;
}

function publishErrorMessage(err: unknown): string {
  const code = errorCodeOf(err);
  if (code === "CP-ERR-VALIDATE" || code === "WEB-ERR-VALIDATE" || code === "APP-ERR-SCHEMA") {
    const detail = err instanceof Error ? err.message : "";
    return detail && detail !== t("publish.failed")
      ? `${t("publish.validationBlocked")}: ${detail}`
      : t("publish.validationBlocked");
  }
  if (code === "CP-ERR-STATE") {
    return t("publish.stateBlocked", { code });
  }
  if (code) {
    const detail = err instanceof Error ? err.message : "";
    return detail ? t("publish.failedWithCode", { code }) + ` — ${detail}` : t("publish.failedWithCode", { code });
  }
  return err instanceof Error ? err.message : t("publish.failed");
}

export function PublishWebDialog({ open, onClose }: PublishWebDialogProps) {
  useLocaleStore((s) => s.locale);
  const artifactId = useWorkspaceStore((s) => s.artifactId);
  const artifactKind = useWorkspaceStore((s) => s.artifactKind);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const saveDirty = useWorkspaceStore((s) => s.saveDirty);
  const saveCurrentArtifact = useWorkspaceStore((s) => s.saveCurrentArtifact);
  const blogPublish = useWorkspaceStore((s) => s.blogPublish);
  const setBlogPublish = useWorkspaceStore((s) => s.setBlogPublish);
  const [report, setReport] = useState<AppValidateReport | null>(null);
  const [releases, setReleases] = useState<WebRelease[]>([]);
  const [busy, setBusy] = useState(false);
  const isMini = artifactKind === "miniprogram";
  const postsKind = usesHostedPosts(templateId);
  const liveReleaseId = blogPublish?.liveRelease?.id;

  const reloadReleases = async (id: string) => {
    const { items } = await api.listWebReleases(id);
    setReleases(items);
  };

  useEffect(() => {
    if (!open || !artifactId) return;
    let cancelled = false;
    void (async () => {
      try {
        const next = await api.validateAppArtifact(artifactId);
        if (!cancelled) setReport(next);
      } catch (err) {
        if (!cancelled) {
          setReport({
            ok: false,
            issues: [{ message: err instanceof Error ? err.message : t("publish.validateFailed") }],
          });
        }
      }
      try {
        const { items } = await api.listWebReleases(artifactId);
        if (!cancelled) setReleases(items);
      } catch {
        if (!cancelled) setReleases([]);
      }
      try {
        const status = await api.getWebPublish(artifactId);
        if (!cancelled) setBlogPublish(status);
      } catch {
        /* never published */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, artifactId, setBlogPublish]);

  const publish = async () => {
    if (!artifactId) {
      message.warning(t("publish.saveFirst"));
      return;
    }
    setBusy(true);
    try {
      if (saveDirty) {
        const ok = await saveCurrentArtifact();
        if (!ok) {
          message.error(t("publish.saveFailed"));
          return;
        }
      }
      let next = report;
      try {
        next = await api.validateAppArtifact(artifactId);
        setReport(next);
      } catch (err) {
        next = {
          ok: false,
          issues: [{ message: err instanceof Error ? err.message : t("publish.validateFailed") }],
        };
        setReport(next);
      }
      if (next && !next.ok) {
        message.error(t("publish.validationBlocked"));
        return;
      }
      await api.publishWeb(artifactId);
      try {
        const status = await api.getWebPublish(artifactId);
        setBlogPublish(status);
      } catch {
        /* status endpoint may lag */
      }
      try {
        await reloadReleases(artifactId);
      } catch {
        /* history may lag */
      }
      message.success(t("publish.live"));
    } catch (err) {
      message.error(publishErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const rollback = async (targetReleaseId: string) => {
    if (!artifactId) return;
    setBusy(true);
    try {
      const status = await api.rollbackWeb(artifactId, targetReleaseId);
      setBlogPublish(status);
      try {
        await reloadReleases(artifactId);
      } catch {
        /* history may lag */
      }
      message.success(t("publish.rollbackOk"));
    } catch (err) {
      message.error(err instanceof Error ? err.message : t("publish.rollbackFailed"));
    } finally {
      setBusy(false);
    }
  };

  const confirmRollback = (rel: WebRelease) => {
    const live = blogPublish?.liveRelease;
    const targetStamp = rel.status
      ? `${rel.status} · ${rel.createdAt.slice(0, 19)}`
      : rel.createdAt.slice(0, 19);
    const createdAt =
      live && live.id !== rel.id
        ? `${live.createdAt.slice(0, 19)}${live.status ? ` (${live.status})` : ""} → ${targetStamp}`
        : targetStamp;
    Modal.confirm({
      title: t("publish.rollbackTitle"),
      content: t("publish.rollbackBody", { createdAt }),
      okText: t("publish.rollbackConfirm"),
      cancelText: t("confirm.cancel"),
      okButtonProps: { danger: true },
      zIndex: 1100,
      onOk: () => rollback(rel.id),
    });
  };

  const downloadZip = async () => {
    if (!artifactId) {
      message.warning(t("publish.saveFirst"));
      return;
    }
    setBusy(true);
    try {
      if (saveDirty) {
        const ok = await saveCurrentArtifact();
        if (!ok) throw new Error(t("publish.saveFailed"));
      }
      const blob = await api.exportPublishZip(artifactId, isMini ? "miniprogram" : "web");
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = isMini ? "miniprogram.zip" : "site.zip";
      a.click();
      URL.revokeObjectURL(href);
      message.success(t("publish.downloadStarted"));
    } catch (err) {
      message.error(err instanceof Error ? err.message : t("publish.exportFailed"));
    } finally {
      setBusy(false);
    }
  };

  const issues = report?.issues?.filter((i) => i.message) ?? [];
  const publicUrl = blogPublish?.publicUrl || blogPublish?.liveRelease?.publicUrl;
  const publicHref = resolvePublicHref(publicUrl);
  const parentText = publicHref
    ? t(isMini ? "publish.parentMessageMini" : "publish.parentMessageWeb", { url: publicHref })
    : "";

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(t("publish.copied"));
    } catch {
      message.error(t("publish.copyFailed"));
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t("publish.title")}
      footer={null}
      destroyOnHidden
      width={560}
    >
      <p className={styles.hint}>{t(isMini ? "publish.hintMini" : "publish.hintWeb")}</p>
      {report && !report.ok && (
        <div className={styles.issues}>
          {issues.map((issue) => (
            <div key={`${issue.code}:${issue.message}`} className={styles.issue}>
              {issue.code ? `${issue.code}: ` : ""}
              {issue.message}
            </div>
          ))}
        </div>
      )}
      {blogPublish?.lastFailedRelease?.errorCode ? (
        <p className={styles.issue}>
          {t("publish.lastFailed", { code: blogPublish.lastFailedRelease.errorCode })}
        </p>
      ) : null}

      {publicHref ? (
        <div className={styles.shareBox}>
          <div className={styles.shareUrlRow}>
            <Input value={publicHref} readOnly />
            <Button icon={<CopyOutlined />} onClick={() => void copy(publicHref)}>
              {t("publish.copyLink")}
            </Button>
            <Button icon={<LinkOutlined />} href={publicHref} target="_blank" rel="noreferrer">
              {t("publish.open")}
            </Button>
          </div>
          <div className={styles.shareQr}>
            <QRCode value={publicHref} size={128} />
            <div>
              <p className={styles.hint}>{t("publish.shareHint")}</p>
              <Input.TextArea value={parentText} readOnly autoSize={{ minRows: 3, maxRows: 5 }} />
              <Button
                size="small"
                className={styles.shareCopyMsg}
                icon={<CopyOutlined />}
                onClick={() => void copy(parentText)}
              >
                {t("publish.copyMessage")}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className={styles.hint}>{t("publish.noUrl")}</p>
      )}

      <div className={styles.formActions}>
        <Button
          type="primary"
          loading={busy}
          disabled={report?.ok === false}
          onClick={() => void publish()}
        >
          {publicHref ? t("publish.publishUpdate") : t("publish.goLive")}
        </Button>
        <Button icon={<DownloadOutlined />} loading={busy} onClick={() => void downloadZip()}>
          {isMini ? t("publish.downloadMini") : t("publish.downloadWeb")}
        </Button>
        <Button onClick={onClose}>{t("publish.close")}</Button>
      </div>
      {isMini && (
        <p className={styles.hint}>
          {t(postsKind ? "publish.miniZipHintPosts" : "publish.miniZipHint")}
        </p>
      )}
      {releases.length > 0 && (
        <div>
          <h3 className={styles.inspectorTitle}>{t("publish.releases")}</h3>
          {releases.map((rel) => {
            const live = releaseIsLive(rel, liveReleaseId);
            const errorCode = releaseErrorCode(rel);
            return (
              <div key={rel.id} className={styles.releaseRow}>
                <span>
                  {rel.status} · {rel.createdAt.slice(0, 19)}
                  {errorCode ? ` · ${t("publish.releaseError", { code: errorCode })}` : ""}
                </span>
                {!live && (
                  <Button size="small" disabled={busy} onClick={() => confirmRollback(rel)}>
                    {t("publish.rollback")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
