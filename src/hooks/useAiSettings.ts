import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AiProviderId,
  type AiUserSettings,
  aiOptionsBody,
  loadAiSettings,
  resolveSettings,
  saveAiSettings,
} from "../lib/ai-settings";
import { type AiPublicConfig, api } from "../lib/api";

export function useAiSettings() {
  const [config, setConfig] = useState<AiPublicConfig | null>(null);
  const [settings, setSettings] = useState<AiUserSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .aiConfig()
      .then((c) => {
        if (cancelled) return;
        setConfig(c);
        const resolved = resolveSettings(c, loadAiSettings());
        setSettings(resolved);
        saveAiSettings(resolved);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setProvider = useCallback(
    (provider: AiProviderId) => {
      if (!config) return;
      const def = config.providers.find((p) => p.id === provider);
      const next = {
        provider,
        model: def?.defaultModel ?? settings?.model ?? config.defaultModel,
      };
      setSettings(next);
      saveAiSettings(next);
    },
    [config, settings],
  );

  const setModel = useCallback(
    (model: string) => {
      if (!settings) return;
      const next = { ...settings, model };
      setSettings(next);
      saveAiSettings(next);
    },
    [settings],
  );

  const aiOpts = useMemo(() => (settings ? aiOptionsBody(settings) : {}), [settings]);

  const currentProvider = config?.providers.find((p) => p.id === settings?.provider);

  return {
    config,
    settings,
    aiOpts,
    setProvider,
    setModel,
    currentProvider,
    ready: Boolean(config && settings),
  };
}
