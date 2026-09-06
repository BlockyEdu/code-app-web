import { usesHostedPosts } from "../lib/app-studio/app-schema";
import { useLocaleStore } from "../lib/locale-store";
import { useWorkspaceStore } from "../stores/workspace";
import styles from "./BlogStudio.module.scss";

export function BlogLogicPanel() {
  const schema = useWorkspaceStore((s) => s.appSchema);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const zh = useLocaleStore((s) => s.locale) === "zh-CN";
  const logic = schema?.logic ?? [];
  const hasPosts = usesHostedPosts(templateId);

  return (
    <div className={styles.logic}>
      <h3 className={styles.inspectorTitle}>{zh ? "事件链路" : "Event chain"}</h3>
      <p className={styles.hint}>
        {hasPosts
          ? zh
            ? "首期只读：点击卡片 → 打开详情。逻辑写在 app.schema.json 的 logic 字段。"
            : "Read-only for v1: click a card to open the detail page."
          : zh
            ? "落地页是单页站点：改文案后直接上线分享。没有文章列表。"
            : "A landing page is a single screen. Edit copy, then ship a shareable URL."}
      </p>
      {hasPosts && (
        <div className={styles.chain}>
          <div className={styles.chainStep}>
            {zh
              ? "1. 点击卡片（postList · selectPost）"
              : "1. Click a card (postList · selectPost)"}
          </div>
          <div className={styles.chainArrow}>↓</div>
          <div className={styles.chainStep}>navigate(/posts/:slug)</div>
          <div className={styles.chainArrow}>↓</div>
          <div className={styles.chainStep}>
            GET posts · {zh ? "按 slug 绑定详情" : "bind detail by slug"}
          </div>
        </div>
      )}
      <h3 className={styles.inspectorTitle}>schema.logic</h3>
      <pre className={styles.logicJson}>{JSON.stringify(logic, null, 2)}</pre>
    </div>
  );
}
