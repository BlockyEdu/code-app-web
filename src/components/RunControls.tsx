import { useCallback, useEffect, useState } from 'react';
import {
  fetchRuntimeConfig,
  formatExecuteResult,
  isElectronHost,
  runCloudPro,
  runLocalPro,
  runPreview,
  type RunTier,
} from '../lib/execute';
import type { CodeRuntimeConfig } from '../lib/api';
import { UnauthorizedError } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';
import { useWorkspaceStore } from '../stores/workspace';
import { ProRunModal } from './ProRunModal';

export function RunControls() {
  const { code, languageId, clearConsole, appendConsole } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);
  const openLogin = useAuthStore((s) => s.openLoginPrompt);
  const [runtime, setRuntime] = useState<CodeRuntimeConfig | null>(null);
  const [busy, setBusy] = useState<RunTier | null>(null);
  const [showProModal, setShowProModal] = useState(false);

  const refreshRuntime = useCallback(() => {
    fetchRuntimeConfig()
      .then(setRuntime)
      .catch(() =>
        setRuntime({
          preview: { engines: [] },
          pro: { enabled: true, canExecute: false },
          piston: { reachable: false, url: '' },
          supportedLanguages: [],
        }),
      );
  }, []);

  useEffect(() => {
    refreshRuntime();
  }, [refreshRuntime, user]);

  const canPro =
    runtime?.pro.canExecute &&
    runtime?.pro.enabled &&
    (runtime?.piston.reachable || isElectronHost());

  const runTier = async (tier: RunTier) => {
    clearConsole();
    setBusy(tier);
    try {
      if (tier === 'preview') {
        appendConsole('[info] 预览运行（浏览器）…');
        const result = await runPreview(languageId, code);
        if (result.error) appendConsole(`[error] ${result.error}`);
        result.logs.forEach(appendConsole);
        return;
      }
      if (tier === 'local') {
        appendConsole('[info] 本地 Pro 运行（Electron + Docker Piston）…');
        const result = await runLocalPro(languageId, code);
        if (result.error) appendConsole(`[error] ${result.error}`);
        result.logs.forEach(appendConsole);
        return;
      }
      if (!user) {
        openLogin();
        appendConsole('[info] 请先登录以使用 Pro 云端运行');
        return;
      }
      if (!runtime?.pro.canExecute) {
        setShowProModal(true);
        appendConsole('[info] 需要 BlockyEdu Pro 订阅（演示账号 prolearner / pro123）');
        return;
      }
      if (!runtime?.piston.reachable) {
        appendConsole('[error] Piston 沙箱未启动，请联系管理员或本地 docker compose up piston');
        return;
      }
      appendConsole('[info] Pro 云端运行（Piston）…');
      const result = await runCloudPro(languageId, code);
      formatExecuteResult(result).forEach(appendConsole);
    } catch (err) {
      if (err instanceof UnauthorizedError) openLogin();
      appendConsole(`[error] ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="run-controls">
        <button
          type="button"
          className="btn-run btn-run--preview"
          disabled={busy !== null}
          onClick={() => runTier('preview')}
          title="浏览器内免费预览（JS / typescript.js / Pyodide）"
        >
          {busy === 'preview' ? '…' : '▶'} 预览
        </button>
        {isElectronHost() ? (
          <button
            type="button"
            className="btn-run btn-run--local"
            disabled={busy !== null}
            onClick={() => runTier('local')}
            title="本机 Docker Piston"
          >
            {busy === 'local' ? '…' : '▶'} 本地 Pro
          </button>
        ) : (
          <button
            type="button"
            className={`btn-run btn-run--pro ${canPro ? '' : 'btn-run--locked'}`}
            disabled={busy !== null}
            onClick={() => runTier('cloud')}
            title={
              canPro
                ? '云端 Piston 完整运行（付费）'
                : `Pro 云端运行需订阅；沙箱: ${runtime?.piston.reachable ? '在线' : '离线'}`
            }
          >
            {busy === 'cloud' ? '…' : '▶'} Pro
            {!canPro && <span className="run-pro-badge">Pro</span>}
          </button>
        )}
        {runtime && (
          <span className="run-status" title={runtime.piston.url}>
            {runtime.piston.reachable ? '沙箱在线' : '沙箱离线'}
            {runtime.pro.canExecute ? ' · 已开通 Pro' : ''}
          </span>
        )}
      </div>
      {showProModal && <ProRunModal onClose={() => setShowProModal(false)} />}
    </>
  );
}
