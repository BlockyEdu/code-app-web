import { useWorkspaceStore } from '../stores/workspace';
import { navigate } from '../lib/navigate';

export function ProjectPanel() {
  const artifactName = useWorkspaceStore((s) => s.artifactName);
  const artifactId = useWorkspaceStore((s) => s.artifactId);
  const currentProject = useWorkspaceStore((s) => s.currentProject);
  const setShowNewProjectDialog = useWorkspaceStore((s) => s.setShowNewProjectDialog);

  return (
    <div className="project-panel">
      <div className="panel-header">当前练习</div>
      <p className="muted" style={{ padding: '0 12px', fontSize: 12 }}>
        项目列表已移至首页；此处显示当前打开的练习信息。
      </p>
      <div style={{ padding: '8px 12px', fontSize: 12 }}>
        <div>
          当前：<strong>{artifactName || '未打开'}</strong>
        </div>
        <div className="muted">
          Artifact：{artifactId ? artifactId.slice(0, 8) : '—'}
          {currentProject ? ` · Project：${currentProject.id.slice(0, 8)}` : ''}
        </div>
      </div>
      <div className="btn-row" style={{ padding: '0 12px 12px' }}>
        <button type="button" className="btn-primary" onClick={() => navigate('/')}>
          返回项目列表
        </button>
        <button
          type="button"
          onClick={() => {
            navigate('/');
            setShowNewProjectDialog(true);
          }}
        >
          新建练习
        </button>
      </div>
    </div>
  );
}
