import { usesHostedPosts } from "../lib/app-studio/app-schema";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { useWorkspaceStore } from "../stores/workspace";
import styles from "./BlogStudio.module.scss";

export function BlogLogicPanel() {
  useLocaleStore((s) => s.locale);
  const schema = useWorkspaceStore((s) => s.appSchema);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const logic = schema?.logic ?? [];
  const hasPosts = usesHostedPosts(templateId);

  return (
    <div className={styles.logic}>
      <h3 className={styles.inspectorTitle}>{t("studio.eventChain")}</h3>
      <p className={styles.hint}>
        {hasPosts ? t("studio.logicHintPosts") : t("studio.logicHintLanding")}
      </p>
      {hasPosts && (
        <div className={styles.chain}>
          <div className={styles.chainStep}>{t("studio.clickCard")}</div>
          <div className={styles.chainArrow}>↓</div>
          <div className={styles.chainStep}>navigate(/posts/:slug)</div>
          <div className={styles.chainArrow}>↓</div>
          <div className={styles.chainStep}>GET posts · {t("studio.bindBySlug")}</div>
        </div>
      )}
      <h3 className={styles.inspectorTitle}>schema.logic</h3>
      <pre className={styles.logicJson}>{JSON.stringify(logic, null, 2)}</pre>
    </div>
  );
}
