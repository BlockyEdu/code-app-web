import { useEffect, useRef, useState } from "react";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { getLanguagePlugin, listCoreLanguages, listExtensionLanguages } from "../plugins";
import { useWorkspaceStore } from "../stores/workspace";
import { LanguageSwitchModal } from "./LanguageSwitchModal";

export function LanguageSelector() {
  useLocaleStore((s) => s.locale);
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
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showMore]);

  const core = listCoreLanguages();
  const extensions = listExtensionLanguages();
  const active = getLanguagePlugin(languageId);

  const requestSwitch = (id: string) => {
    if (id === languageId) return;
    const target = getLanguagePlugin(id);
    const current = getLanguagePlugin(languageId);
    const needsConfirm =
      editorMode === "monaco" &&
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
        <span className="language-selector-label">{t("language.label")}</span>
        <div className="language-pills">
          {core.map((lang) => (
            <button
              key={lang.id}
              type="button"
              className={`lang-pill ${languageId === lang.id ? "active" : ""}`}
              onClick={() => requestSwitch(lang.id)}
              title={lang.description}
            >
              {lang.label}
            </button>
          ))}
          <div className="lang-more-wrap" ref={moreRef}>
            <button
              type="button"
              className={`lang-pill lang-pill--more ${extensions.some((e) => e.id === languageId) ? "active" : ""}`}
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
            >
              {t("language.more")} ▾
            </button>
            {showMore && (
              <div className="lang-dropdown">
                <p className="lang-dropdown-title">{t("language.extensions")}</p>
                {extensions.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    className={`lang-dropdown-item ${languageId === lang.id ? "active" : ""}`}
                    title={lang.description}
                    onClick={() => requestSwitch(lang.id)}
                  >
                    <span>{lang.name}</span>
                    <span className="lang-plugin-badge">{t("language.plugin")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {active && (
          <span className="language-meta" title={active.description}>
            {active.name}
            {active.tier === "extension" && ` · ${t("language.needsPlugin")}`}
            {!active.blockly && active.tier === "core" && ` · ${t("language.proOnly")}`}
          </span>
        )}
      </div>

      {pending && (
        <LanguageSwitchModal
          title={t("language.switchTitle")}
          tone="warn"
          confirmLabel={t("language.switchConfirm")}
          onCancel={() => setPending(null)}
          onConfirm={confirmSwitch}
        >
          <p>{t("language.switchBody")}</p>
          <p>
            <strong>{getLanguagePlugin(pending)?.name}</strong>
          </p>
        </LanguageSwitchModal>
      )}
    </>
  );
}
