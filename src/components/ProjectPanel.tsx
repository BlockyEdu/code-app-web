import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { navigate } from "../lib/navigate";
import { useWorkspaceStore } from "../stores/workspace";

export function ProjectPanel() {
  useLocaleStore((s) => s.locale);
  const artifactName = useWorkspaceStore((s) => s.artifactName);
  const artifactId = useWorkspaceStore((s) => s.artifactId);
  const currentProject = useWorkspaceStore((s) => s.currentProject);
  const setShowNewProjectDialog = useWorkspaceStore((s) => s.setShowNewProjectDialog);

  return (
    <div className="project-panel">
      <div className="panel-header">{t("projectPanel.title")}</div>
      <p className="muted" style={{ padding: "0 12px", fontSize: 12 }}>
        {t("projectPanel.hint")}
      </p>
      <div style={{ padding: "8px 12px", fontSize: 12 }}>
        <div>
          {t("projectPanel.current")} <strong>{artifactName || t("projectPanel.none")}</strong>
        </div>
        <div className="muted">
          Artifact：{artifactId ? artifactId.slice(0, 8) : "—"}
          {currentProject ? ` · Project：${currentProject.id.slice(0, 8)}` : ""}
        </div>
      </div>
      <div className="btn-row" style={{ padding: "0 12px 12px" }}>
        <button type="button" className="btn-primary" onClick={() => navigate("/")}>
          {t("projectPanel.back")}
        </button>
        <button
          type="button"
          onClick={() => {
            navigate("/");
            setShowNewProjectDialog(true);
          }}
        >
          {t("projectPanel.newExercise")}
        </button>
      </div>
    </div>
  );
}
