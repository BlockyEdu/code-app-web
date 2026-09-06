import { CopyOutlined, DownloadOutlined, LinkOutlined } from "@ant-design/icons";
import { Button, Input, Modal, message, QRCode } from "antd";
import { useEffect, useState } from "react";
import { type AppValidateReport, api, type WebRelease } from "../lib/api";
import { usesHostedPosts } from "../lib/app-studio/app-schema";
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

export function PublishWebDialog({ open, onClose }: PublishWebDialogProps) {
  const artifactId = useWorkspaceStore((s) => s.artifactId);
  const artifactKind = useWorkspaceStore((s) => s.artifactKind);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const saveDirty = useWorkspaceStore((s) => s.saveDirty);
  const saveCurrentArtifact = useWorkspaceStore((s) => s.saveCurrentArtifact);
  const blogPublish = useWorkspaceStore((s) => s.blogPublish);
  const setBlogPublish = useWorkspaceStore((s) => s.setBlogPublish);
  const zh = useLocaleStore((s) => s.locale) === "zh-CN";
  const [report, setReport] = useState<AppValidateReport | null>(null);
  const [releases, setReleases] = useState<WebRelease[]>([]);
  const [busy, setBusy] = useState(false);
  const isMini = artifactKind === "miniprogram";
  const postsKind = usesHostedPosts(templateId);

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
            issues: [{ message: err instanceof Error ? err.message : "无法校验" }],
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
      message.warning(zh ? "请先保存作品" : "Save the project first");
      return;
    }
    setBusy(true);
    try {
      if (saveDirty) {
        const ok = await saveCurrentArtifact();
        if (!ok) {
          message.error(zh ? "保存失败，无法发布" : "Save failed, cannot publish");
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
          issues: [{ message: err instanceof Error ? err.message : "无法校验" }],
        };
        setReport(next);
      }
      if (next && !next.ok) {
        message.error(zh ? "校验未通过，不能发布" : "Validation failed");
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
        const { items } = await api.listWebReleases(artifactId);
        setReleases(items);
      } catch {
        /* ignore */
      }
      message.success(zh ? "已上线，可以把链接发给别人了" : "Live — share the link");
    } catch (err) {
      message.error(err instanceof Error ? err.message : zh ? "发布失败" : "Publish failed");
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
      message.success(zh ? "已请求回滚" : "Rollback requested");
    } catch (err) {
      message.error(err instanceof Error ? err.message : zh ? "回滚失败" : "Rollback failed");
    } finally {
      setBusy(false);
    }
  };

  const downloadZip = async () => {
    if (!artifactId) {
      message.warning(zh ? "请先保存作品" : "Save the project first");
      return;
    }
    setBusy(true);
    try {
      if (saveDirty) {
        const ok = await saveCurrentArtifact();
        if (!ok) throw new Error(zh ? "保存失败" : "Save failed");
      }
      const blob = await api.exportPublishZip(artifactId, isMini ? "miniprogram" : "web");
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = isMini ? "miniprogram.zip" : "site.zip";
      a.click();
      URL.revokeObjectURL(href);
      message.success(zh ? "已开始下载" : "Download started");
    } catch (err) {
      message.error(err instanceof Error ? err.message : zh ? "导出失败" : "Export failed");
    } finally {
      setBusy(false);
    }
  };

  const issues = report?.issues?.filter((i) => i.message) ?? [];
  const publicUrl = blogPublish?.publicUrl || blogPublish?.liveRelease?.publicUrl;
  const publicHref = resolvePublicHref(publicUrl);
  const parentText = publicHref
    ? zh
      ? `我用 BlockyEdu 做了一个${isMini ? "小程序（网页版）" : "网站"}，打开就能看：\n${publicHref}`
      : `I shipped this on BlockyEdu:\n${publicHref}`
    : "";

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(zh ? "已复制" : "Copied");
    } catch {
      message.error(zh ? "复制失败" : "Copy failed");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={zh ? "上线分享" : "Ship & share"}
      footer={null}
      destroyOnHidden
      width={560}
    >
      <p className={styles.hint}>
        {zh
          ? isMini
            ? "托管一个网页版给家长打开；同时下载微信开发者工具工程。微信审核不在这里保证通过。"
            : "BlockyEdu 帮你托管一个别人打得开的网址；也可以下载 zip 自己部署。"
          : isMini
            ? "Host an H5 link for parents, and download a WeChat DevTools project. WeChat review is not guaranteed."
            : "Host a public URL, or download a zip to deploy yourself."}
      </p>
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

      {publicHref ? (
        <div className={styles.shareBox}>
          <div className={styles.shareUrlRow}>
            <Input value={publicHref} readOnly />
            <Button icon={<CopyOutlined />} onClick={() => void copy(publicHref)}>
              {zh ? "复制链接" : "Copy"}
            </Button>
            <Button icon={<LinkOutlined />} href={publicHref} target="_blank" rel="noreferrer">
              {zh ? "打开" : "Open"}
            </Button>
          </div>
          <div className={styles.shareQr}>
            <QRCode value={publicHref} size={128} />
            <div>
              <p className={styles.hint}>
                {zh ? "发给家长 / 同学（扫码或复制下面这段）" : "Send to parents or classmates"}
              </p>
              <Input.TextArea value={parentText} readOnly autoSize={{ minRows: 3, maxRows: 5 }} />
              <Button
                size="small"
                className={styles.shareCopyMsg}
                icon={<CopyOutlined />}
                onClick={() => void copy(parentText)}
              >
                {zh ? "复制给家长的话" : "Copy message"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className={styles.hint}>
          {zh
            ? "还没有公开网址。确认发布后，家长不用登录就能打开。"
            : "No public URL yet. After you confirm, anyone can open it without signing in."}
        </p>
      )}

      <div className={styles.formActions}>
        <Button
          type="primary"
          loading={busy}
          disabled={report?.ok === false}
          onClick={() => void publish()}
        >
          {publicHref ? (zh ? "更新上线" : "Publish update") : zh ? "确认上线" : "Go live"}
        </Button>
        <Button icon={<DownloadOutlined />} loading={busy} onClick={() => void downloadZip()}>
          {isMini
            ? zh
              ? "下载微信工程"
              : "Download WeChat project"
            : zh
              ? "下载网站 zip"
              : "Download site zip"}
        </Button>
        <Button onClick={onClose}>{zh ? "关闭" : "Close"}</Button>
      </div>
      {isMini && (
        <p className={styles.hint}>
          {zh
            ? postsKind
              ? "zip 用微信开发者工具导入。网页版链接给没装开发者工具的人看。"
              : "zip 用微信开发者工具导入。"
            : "Import the zip in WeChat DevTools. The hosted H5 is for people without DevTools."}
        </p>
      )}
      {releases.length > 0 && (
        <div>
          <h3 className={styles.inspectorTitle}>{zh ? "历史版本" : "Releases"}</h3>
          {releases.map((rel) => (
            <div key={rel.id} className={styles.releaseRow}>
              <span>
                {rel.status} · {rel.createdAt.slice(0, 19)}
              </span>
              <Button size="small" disabled={busy} onClick={() => void rollback(rel.id)}>
                {zh ? "回滚" : "Rollback"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
