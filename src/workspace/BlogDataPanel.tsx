import { Button, Input, message, Select } from "antd";
import { useEffect, useState } from "react";
import { api, type BlogPostInput, type BlogPostRecord, type BlogPostStatus } from "../lib/api";
import { slugifyTitle } from "../lib/app-studio/app-schema";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { useWorkspaceStore } from "../stores/workspace";
import styles from "./BlogStudio.module.scss";

type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: BlogPostStatus;
};

const emptyDraft = (): Draft => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  status: "draft",
});

function recordNoun(templateId: string | null | undefined): string {
  if (templateId === "作品集") return t("studio.nounWorks");
  if (templateId === "资讯小程序") return t("studio.nounStories");
  return t("studio.nounPosts");
}

function toDraft(post: BlogPostRecord): Draft {
  return {
    title: post.data.title ?? "",
    slug: post.slug,
    excerpt: post.data.excerpt ?? "",
    content: post.data.content ?? "",
    status: post.status,
  };
}

export function BlogDataPanel() {
  useLocaleStore((s) => s.locale);
  const artifactId = useWorkspaceStore((s) => s.artifactId);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const posts = useWorkspaceStore((s) => s.blogPosts);
  const setBlogPosts = useWorkspaceStore((s) => s.setBlogPosts);
  const refreshBlogRecords = useWorkspaceStore((s) => s.refreshBlogRecords);
  const noun = recordNoun(templateId);
  const [selectedId, setSelectedId] = useState<string | "new" | null>(posts[0]?.id ?? null);
  const [draft, setDraft] = useState<Draft>(posts[0] ? toDraft(posts[0]) : emptyDraft());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!artifactId) return;
    void refreshBlogRecords();
  }, [artifactId, refreshBlogRecords]);

  const select = (post: BlogPostRecord) => {
    setSelectedId(post.id);
    setDraft(toDraft(post));
  };

  const startNew = () => {
    setSelectedId("new");
    setDraft(emptyDraft());
  };

  const persist = async () => {
    if (!artifactId) {
      message.warning(t("studio.saveFirst"));
      return;
    }
    const title = draft.title.trim();
    if (!title) {
      message.warning(t("studio.titleRequired"));
      return;
    }
    const body: BlogPostInput = {
      title,
      slug: (draft.slug.trim() || slugifyTitle(title)).slice(0, 80),
      excerpt: draft.excerpt.slice(0, 500),
      content: draft.content,
      status: draft.status,
    };
    setBusy(true);
    try {
      if (selectedId && selectedId !== "new") {
        const updated = await api.updatePost(artifactId, selectedId, body);
        setBlogPosts(posts.map((p) => (p.id === updated.id ? updated : p)));
        setDraft(toDraft(updated));
        message.success(t("studio.postSaved"));
      } else {
        const created = await api.createPost(artifactId, body);
        setBlogPosts([created, ...posts]);
        setSelectedId(created.id);
        setDraft(toDraft(created));
        message.success(t("studio.postCreated"));
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : t("studio.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!artifactId || !selectedId || selectedId === "new") return;
    setBusy(true);
    try {
      await api.deletePost(artifactId, selectedId);
      const next = posts.filter((p) => p.id !== selectedId);
      setBlogPosts(next);
      if (next[0]) select(next[0]);
      else startNew();
      message.success(t("studio.deleted"));
    } catch (err) {
      message.error(err instanceof Error ? err.message : t("studio.deleteFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.split}>
      <div className={styles.listPane}>
        <div className={styles.listHead}>
          <span className={styles.listTitle}>{noun}</span>
          <Button size="small" type="link" onClick={startNew}>
            {t("studio.new")}
          </Button>
        </div>
        {posts.length === 0 && selectedId !== "new" && (
          <p className={styles.empty}>{t("studio.empty", { noun })}</p>
        )}
        {posts.map((post) => (
          <button
            key={post.id}
            type="button"
            className={`${styles.postItem} ${selectedId === post.id ? styles.postItemActive : ""}`}
            onClick={() => select(post)}
          >
            <span>{post.data.title || post.slug}</span>
            <span className={styles.postMeta}>
              {post.status} · {post.slug}
            </span>
          </button>
        ))}
      </div>
      <div className={styles.formPane}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>title</span>
          <Input
            value={draft.title}
            onChange={(e) => {
              const title = e.target.value;
              setDraft((d) => ({
                ...d,
                title,
                slug: d.slug || slugifyTitle(title),
              }));
            }}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>slug</span>
          <Input
            value={draft.slug}
            onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>excerpt</span>
          <Input.TextArea
            rows={2}
            value={draft.excerpt}
            onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>content</span>
          <Input.TextArea
            rows={10}
            value={draft.content}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>status</span>
          <Select
            style={{ width: "100%" }}
            value={draft.status}
            options={[
              { value: "draft", label: t("studio.draft") },
              { value: "published", label: t("studio.published") },
            ]}
            onChange={(status) => setDraft((d) => ({ ...d, status }))}
          />
        </div>
        <div className={styles.formActions}>
          <Button type="primary" loading={busy} onClick={() => void persist()}>
            {t("studio.savePost")}
          </Button>
          {selectedId && selectedId !== "new" && (
            <Button danger loading={busy} onClick={() => void remove()}>
              {t("studio.delete")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
