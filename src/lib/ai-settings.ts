export type AiProviderId = 'deepseek' | 'doubao' | 'gemini';

export interface AiModelOption {
  id: string;
  name: string;
  free?: boolean;
}

export interface AiProviderInfo {
  id: AiProviderId;
  name: string;
  defaultModel: string;
  models: AiModelOption[];
  configured: boolean;
}

export interface AiPublicConfig {
  defaultProvider: AiProviderId;
  defaultModel: string;
  providers: AiProviderInfo[];
}

export interface AiUserSettings {
  provider: AiProviderId;
  model: string;
}

const STORAGE_KEY = 'blockyedu_ai_settings';

export function loadAiSettings(): AiUserSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AiUserSettings;
  } catch {
    return null;
  }
}

export function saveAiSettings(settings: AiUserSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resolveSettings(
  config: AiPublicConfig,
  saved: AiUserSettings | null,
): AiUserSettings {
  const provider =
    saved?.provider && config.providers.some((p) => p.id === saved.provider)
      ? saved.provider
      : config.defaultProvider;
  const providerDef = config.providers.find((p) => p.id === provider);
  const model =
    saved?.model &&
    providerDef?.models.some((m) => m.id === saved.model)
      ? saved.model
      : (providerDef?.defaultModel ?? config.defaultModel);
  return { provider, model };
}

export function aiOptionsBody(settings: AiUserSettings) {
  return { provider: settings.provider, model: settings.model };
}
