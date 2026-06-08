import { useEffect, useRef, useState } from 'react';
import {
  getLanguagePlugin,
  listCoreLanguages,
  listExtensionLanguages,
} from '../plugins';
import { useWorkspaceStore } from '../stores/workspace';
import { LanguageSwitchModal } from './LanguageSwitchModal';

export function LanguageSelector() {
  const languageId = useWorkspaceStore((s) => s.languageId);
  const editorMode = useWorkspaceStore((s) => s.editorMode);
  const setLanguage = useWorkspaceStore((s) => s.setLanguage);
  const [pending, setPending] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMore) return;
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showMore]);

  const core = listCoreLanguages();
  const extensions = listExtensionLanguages();
  const active = getLanguagePlugin(languageId);

  const requestSwitch = (id: string) => {
    if (id === languageId) return;
    const target = getLanguagePlugin(id);
    const current = getLanguagePlugin(languageId);
    const needsConfirm =
      editorMode === 'monaco' &&
      current?.blockly &&
      !target?.blockly &&
      useWorkspaceStore.getState().monacoManuallyEdited;
    if (needsConfirm) {
      setPending(id);
      return;
    }
    setLanguage(id);
    setShowMore(false);
  };

  const confirmSwitch = () => {
    if (pending) {
      setLanguage(pending);
      setPending(null);
      setShowMore(false);
    }
  };

  return (
    <>
      <div className="language-selector">
        <span className="language-selector-label">语言</span>
        <div className="language-pills">
          {core.map((lang) => (
            <button
              key={lang.id}
              type="button"
              className={`lang-pill ${languageId === lang.id ? 'active' : ''}`}
              onClick={() => requestSwitch(lang.id)}
              title={lang.description}
            >
              {lang.label}
            </button>
          ))}
          <div className="lang-more-wrap" ref={moreRef}>
            <button
              type="button"
              className={`lang-pill lang-pill--more ${extensions.some((e) => e.id === languageId) ? 'active' : ''}`}
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
            >
              更多 ▾
            </button>
            {showMore && (
              <div className="lang-dropdown">
                <p className="lang-dropdown-title">扩展语言（插件）</p>
                {extensions.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    className={`lang-dropdown-item ${languageId === lang.id ? 'active' : ''}`}
                    onClick={() => requestSwitch(lang.id)}
                  >
                    <span>{lang.name}</span>
                    <span className="lang-plugin-badge">插件</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {active && (
          <span className="language-meta" title={active.description}>
            {active.name}
            {active.tier === 'extension' && ' · 需插件运行'}
            {!active.blockly && active.tier === 'core' && ' · 专业模式'}
          </span>
        )}
      </div>

      {pending && (
        <LanguageSwitchModal
          title="切换编程语言"
          tone="warn"
          confirmLabel="确认切换"
          onCancel={() => setPending(null)}
          onConfirm={confirmSwitch}
        >
          <p>切换语言将加载该语言的代码缓冲区；当前未保存的手改可能丢失。</p>
          <p>
            目标：
            <strong>{getLanguagePlugin(pending)?.name}</strong>
          </p>
        </LanguageSwitchModal>
      )}
    </>
  );
}
