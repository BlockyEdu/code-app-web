import { useEffect, useState } from 'react';
import { type Project, UnauthorizedError, api } from '../lib/api';
import { useWorkspaceStore } from '../stores/workspace';

export function ProjectPanel() {
  const { currentProject, projectName, code, blockXml, languageId, setCurrentProject, setProjectName } =
    useWorkspaceStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [authHint, setAuthHint] = useState('');

  const refresh = () => {
    api
      .listProjects()
      .then((items) => {
        setProjects(items);
        setAuthHint('');
      })
      .catch((err) => {
        if (err instanceof UnauthorizedError) {
          setAuthHint(err.message);
          setProjects([]);
        }
      });
  };

  useEffect(() => {
    refresh();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (currentProject) {
        const updated = await api.updateProject(currentProject.id, {
          name: projectName,
          code,
          blockXml,
          language: languageId,
        });
        setCurrentProject(updated);
      } else {
        const created = await api.createProject({
          name: projectName,
          code,
          blockXml,
          language: languageId,
        });
        setCurrentProject(created);
      }
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const load = async (id: string) => {
    const p = await api.getProject(id);
    setCurrentProject(p);
  };

  const createNew = () => {
    setCurrentProject(null);
    setProjectName('未命名项目');
    useWorkspaceStore.setState({
      code: '',
      blockXml: '',
      consoleOutput: [],
      languageId: 'javascript',
      editorMode: 'blockly',
    });
  };

  return (
    <div className="project-panel">
      <div className="panel-header">项目</div>
      <input
        className="project-name-input"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        placeholder="项目名称"
      />
      <div className="btn-row">
        <button type="button" className="btn-primary" onClick={save} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
        <button type="button" onClick={createNew}>
          新建
        </button>
      </div>
      <ul className="project-list">
        {authHint && <li className="muted">{authHint}</li>}
        {projects.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => load(p.id)}>
              {p.name}
            </button>
            <span className="muted">
              {p.language ?? 'js'} · {new Date(p.updatedAt).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
