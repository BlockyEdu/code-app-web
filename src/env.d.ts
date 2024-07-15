/// <reference types="@rsbuild/core/types" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_EDU_LOGIN_URL?: string;
  readonly VITE_CODE_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
