import { useState } from 'react';
import { api } from '../lib/api';
import { useAiSettings } from '../hooks/useAiSettings';
import { useAuthStore } from '../lib/auth-store';
import { useWorkspaceStore } from '../stores/workspace';
import { ModeSwitchModal } from './ModeSwitchModal';

export function EditorToolbar() {
  const {
    editorMode,
    code,
    blockXml,
    monacoManuallyEdited,
    getCurrentGoal,
    getActiveLanguagePlugin,
    applyProUpgrade,
    restoreBlocklyFromSnapshot,
    addAiMessage,
    setAiLoading,
    aiLoading,
  } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt);
  const { aiOpts, ready } = useAiSettings();

  const [modal, setModal] = useState<'upgrade' | 'restore' | null>(null);
  const [busy, setBusy] = useState(false);

  const requireAuth = () => {
    if (user) return true;
    openLoginPrompt();
    return false;
  };

  const confirmUpgrade = async () => {
    if (!requireAuth() || !ready) return;
    setBusy(true);
    setAiLoading(true);
    try {
      const res = await api.aiUpgradePro({
        ...aiOpts,
        code,
        blockXml,
        goal: getCurrentGoal(),
      });
      applyProUpgrade(res.code, blockXml);
      addAiMessage({
        role: 'assistant',
        content: `**已进入专业模式**\n${res.explanation}${res.mock ? '\n\n_(Mock)_' : ''}`,
      });
      setModal(null);
    } catch (e) {
      addAiMessage({
        role: 'assistant',
        content: `升级失败：${e instanceof Error ? e.message : String(e)}`,
      });
    } finally {
      setBusy(false);
      setAiLoading(false);
    }
  };

  const confirmRestore = () => {
    restoreBlocklyFromSnapshot();
    addAiMessage({
      role: 'assistant',
      content: '已恢复积木快照。专业模式下的手改代码未保留到积木中。',
    });
    setModal(null);
  };

  const isBlockly = editorMode === 'blockly';
  const langPlugin = getActiveLanguagePlugin();
  const supportsBlockly = langPlugin?.blockly ?? false;

  return (
    <>
      <div className={`editor-toolbar editor-toolbar--${editorMode}`}>
        <div className="editor-toolbar-mode">
          <span className={`mode-badge mode-badge--${editorMode}`}>
            {isBlockly ? '🧩 积木模式' : '⌨ 专业模式'}
          </span>
          <span className="mode-desc">
            {langPlugin && (
              <>
                {langPlugin.name}
                {' · '}
              </>
            )}
            {isBlockly
              ? supportsBlockly
                ? '拖拽积木编程，适合入门与课程'
                : '当前语言不支持积木'
              : monacoManuallyEdited
                ? '已手改代码 · 回到积木将丢失未同步修改'
                : 'Monaco 专业编辑 · AI 可辅导'}
          </span>
        </div>
        <div className="editor-toolbar-actions">
          {supportsBlockly &&
            (isBlockly ? (
            <button
              type="button"
              className="btn-mode-upgrade"
              onClick={() => setModal('upgrade')}
              disabled={busy || aiLoading}
            >
              ✨ 升级专业模式
            </button>
          ) : (
            <button
              type="button"
              className="btn-mode-restore"
              onClick={() => setModal('restore')}
              disabled={busy}
            >
              ↩ 回到积木模式
            </button>
          ))}
        </div>
      </div>

      {modal === 'upgrade' && (
        <ModeSwitchModal
          title="升级专业模式"
          tone="info"
          confirmLabel={busy ? 'AI 处理中…' : '确认升级'}
          onCancel={() => setModal(null)}
          onConfirm={confirmUpgrade}
          disabled={busy}
        >
          <p>AI 将基于当前积木生成的代码进行专业模式优化（注释、格式、变量命名）。</p>
          <ul>
            <li>积木布局会保存为快照，便于之后恢复</li>
            <li>需要登录且具备 AI 权限</li>
            <li>升级后可在 Monaco 中自由编辑代码</li>
          </ul>
        </ModeSwitchModal>
      )}

      {modal === 'restore' && (
        <ModeSwitchModal
          title="回到积木模式"
          tone="warn"
          confirmLabel="确认恢复（可能丢失修改）"
          onCancel={() => setModal(null)}
          onConfirm={confirmRestore}
        >
          <p className="warn-text">⚠ 风险提示</p>
          <ul>
            <li>将恢复<strong>升级专业模式前</strong>的积木快照</li>
            <li>专业模式下手动修改的代码<strong>不会</strong>自动转回积木</li>
            {monacoManuallyEdited && (
              <li>您已修改专业代码，切换后将<strong>丢失这些修改</strong></li>
            )}
          </ul>
          <p>如需保留专业代码，请先复制代码或保存项目。</p>
        </ModeSwitchModal>
      )}
    </>
  );
}
