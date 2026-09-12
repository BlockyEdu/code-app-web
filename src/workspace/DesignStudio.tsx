import { Input } from "antd";
import type { ReactNode } from "react";
import type { AppNode, AppSchema } from "../lib/app-studio/app-schema";
import { defaultBlogSchema } from "../lib/app-studio/app-schema";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { useWorkspaceStore } from "../stores/workspace";
import styles from "./BlogStudio.module.scss";

const NODE_LABEL_KEY: Record<string, string> = {
  nav: "studio.nodeNav",
  hero: "studio.nodeHero",
  postList: "studio.nodePostList",
  postDetail: "studio.nodePostDetail",
  footer: "studio.nodeFooter",
};

function nodeLabel(type: string): string {
  const key = NODE_LABEL_KEY[type];
  return key ? t(key) : type;
}

function persistSchema(schema: AppSchema) {
  useWorkspaceStore.getState().updateAppSchema(schema);
}

function patchSite(schema: AppSchema, field: keyof AppSchema["site"], value: string): AppSchema {
  return { ...schema, site: { ...schema.site, [field]: value } };
}

function patchNode(schema: AppSchema, nodeId: string, field: string, value: string): AppSchema {
  return {
    ...schema,
    pages: schema.pages.map((page) => ({
      ...page,
      nodes: page.nodes.map((n) =>
        n.id === nodeId ? { ...n, props: { ...n.props, [field]: value } } : n,
      ),
    })),
  };
}

function Field({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{name}</span>
      {children}
    </div>
  );
}

function SiteFields({ schema }: { schema: AppSchema }) {
  useLocaleStore((s) => s.locale);
  return (
    <>
      <h3 className={styles.inspectorTitle}>{t("studio.site")}</h3>
      <Field name="title">
        <Input
          value={schema.site.title}
          onChange={(e) => persistSchema(patchSite(schema, "title", e.target.value))}
        />
      </Field>
      <Field name="tagline">
        <Input
          value={schema.site.tagline}
          onChange={(e) => persistSchema(patchSite(schema, "tagline", e.target.value))}
        />
      </Field>
      <Field name="primary">
        <div className={styles.colorRow}>
          <input
            type="color"
            value={schema.site.primary || "#1677ff"}
            onChange={(e) => persistSchema(patchSite(schema, "primary", e.target.value))}
            aria-label="primary"
          />
          <Input
            value={schema.site.primary}
            onChange={(e) => persistSchema(patchSite(schema, "primary", e.target.value))}
          />
        </div>
      </Field>
    </>
  );
}

function NodeFields({ schema, node }: { schema: AppSchema; node: AppNode }) {
  useLocaleStore((s) => s.locale);
  const set = (field: string, value: string) =>
    persistSchema(patchNode(schema, node.id, field, value));

  return (
    <>
      <h3 className={styles.inspectorTitle}>
        {nodeLabel(node.type)}
        <span className={styles.fieldLabel}> · {node.id}</span>
      </h3>
      {node.type === "nav" && (
        <Field name="brand">
          <Input value={node.props.brand ?? ""} onChange={(e) => set("brand", e.target.value)} />
        </Field>
      )}
      {node.type === "hero" && (
        <>
          <Field name="heading">
            <Input
              value={node.props.heading ?? ""}
              onChange={(e) => set("heading", e.target.value)}
            />
          </Field>
          <Field name="subheading">
            <Input.TextArea
              rows={3}
              value={node.props.subheading ?? ""}
              onChange={(e) => set("subheading", e.target.value)}
            />
          </Field>
        </>
      )}
      {node.type === "postList" && (
        <>
          <Field name="heading">
            <Input
              value={node.props.heading ?? ""}
              onChange={(e) => set("heading", e.target.value)}
            />
          </Field>
          <Field name="emptyText">
            <Input
              value={node.props.emptyText ?? ""}
              onChange={(e) => set("emptyText", e.target.value)}
            />
          </Field>
        </>
      )}
      {node.type === "postDetail" && (
        <Field name="notFoundText">
          <Input
            value={node.props.notFoundText ?? ""}
            onChange={(e) => set("notFoundText", e.target.value)}
          />
        </Field>
      )}
      {node.type === "footer" && (
        <Field name="text">
          <Input value={node.props.text ?? ""} onChange={(e) => set("text", e.target.value)} />
        </Field>
      )}
    </>
  );
}

export function DesignStudio() {
  useLocaleStore((s) => s.locale);
  const schema = useWorkspaceStore((s) => s.appSchema) ?? defaultBlogSchema();
  const selectedNodeId = useWorkspaceStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useWorkspaceStore((s) => s.setSelectedNodeId);
  const selected = schema.pages.flatMap((p) => p.nodes).find((n) => n.id === selectedNodeId);

  return (
    <div className={styles.studio}>
      <div className={styles.tree}>
        <div className={styles.treeHead}>{t("studio.pages")}</div>
        <button
          type="button"
          className={`${styles.treeNode} ${!selectedNodeId ? styles.treeNodeActive : ""}`}
          onClick={() => setSelectedNodeId(null)}
        >
          {t("studio.siteSettings")}
        </button>
        {schema.pages.map((page) => (
          <div key={page.id}>
            <div className={styles.treePage}>
              {page.title} · {page.path}
            </div>
            {page.nodes.map((node) => (
              <button
                key={node.id}
                type="button"
                className={`${styles.treeNode} ${selectedNodeId === node.id ? styles.treeNodeActive : ""}`}
                onClick={() => setSelectedNodeId(node.id)}
              >
                {nodeLabel(node.type)}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className={styles.inspector}>
        {selected ? <NodeFields schema={schema} node={selected} /> : <SiteFields schema={schema} />}
      </div>
    </div>
  );
}
