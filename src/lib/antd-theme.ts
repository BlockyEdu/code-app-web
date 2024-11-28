import type { ThemeConfig } from "antd";
import { theme } from "antd";

/** Shared Ant Design dark theme for hub + workspace. */
export const codeAppAntdTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#2563eb",
    colorBgContainer: "#181c23",
    colorBgElevated: "#1e2330",
    colorBorder: "#232b38",
    borderRadius: 6,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
};
