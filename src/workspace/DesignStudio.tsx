import { Input } from "antd";
import type { ReactNode } from "react";
import type { AppNode, AppSchema } from "../lib/app-studio/app-schema";
import { defaultBlogSchema } from "../lib/app-studio/app-schema";
import { useLocaleStore } from "../lib/locale-store";
import { useWorkspaceStore } from "../stores/workspace";
import styles from "./BlogStudio.module.scss";

const NODE_LABEL: Record<string, { zh: string; en: string }> = {
  nav: { zh: "导航", en: "Nav" },
  hero: { zh: "Hero", en: "Hero" },
  postList: { zh: "文章列表", en: "Post list" },
  postDetail: { zh: "文章详情", en: "Post detail" },
  footer: { zh: "页脚", en: "Footer" },
};

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
  const zh = useLocaleStore((s) => s.locale) === "zh-CN";
  return (
    <>
      <h3 className={styles.inspectorTitle}>{zh ? "站点" : "Site"}</h3>
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
  const zh = useLocaleStore((s) => s.locale) === "zh-CN";
  const label = NODE_LABEL[node.type];
  const set = (field: string, value: string) =>
    persistSchema(patchNode(schema, node.id, field, value));

  return (
    <>
      <h3 className={styles.inspectorTitle}>
        {label ? (zh ? label.zh : label.en) : node.type}
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
  const schema = useWorkspaceStore((s) => s.appSchema) ?? defaultBlogSchema();
  const selectedNodeId = useWorkspaceStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useWorkspaceStore((s) => s.setSelectedNodeId);
  const zh = useLocaleStore((s) => s.locale) === "zh-CN";
  const selected = schema.pages.flatMap((p) => p.nodes).find((n) => n.id === selectedNodeId);

  return (
    <div className={styles.studio}>
      <div className={styles.tree}>
        <div className={styles.treeHead}>{zh ? "页面" : "Pages"}</div>
        <button
          type="button"
          className={`${styles.treeNode} ${!selectedNodeId ? styles.treeNodeActive : ""}`}
          onClick={() => setSelectedNodeId(null)}
        >
          {zh ? "站点设置" : "Site"}
        </button>
        {schema.pages.map((page) => (
          <div key={page.id}>
            <div className={styles.treePage}>
              {page.title} · {page.path}
            </div>
            {page.nodes.map((node) => {
              const name = NODE_LABEL[node.type];
              return (
                <button
                  key={node.id}
                  type="button"
                  className={`${styles.treeNode} ${selectedNodeId === node.id ? styles.treeNodeActive : ""}`}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  {name ? (zh ? name.zh : name.en) : node.type}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className={styles.inspector}>
        {selected ? <NodeFields schema={schema} node={selected} /> : <SiteFields schema={schema} />}
      </div>
    </div>
  );
}
