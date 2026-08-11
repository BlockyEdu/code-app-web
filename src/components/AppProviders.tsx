import { App as AntdApp, ConfigProvider } from "antd";
import type { ReactNode } from "react";
import { codeAppAntdTheme } from "../lib/antd-theme";
import { useLocaleStore } from "../lib/locale-store";

export function AppProviders({ children }: { children: ReactNode }) {
  const antdLocale = useLocaleStore((s) => s.antdLocale);

  return (
    <ConfigProvider locale={antdLocale} theme={codeAppAntdTheme}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
