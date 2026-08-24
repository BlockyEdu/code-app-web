import { createIdpDevProxyMap, resolveIdpProxyTarget } from "@luminaryworks/auth-dev-proxy";
import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";

export default defineConfig(({ envMode }) => {
  const { publicVars, parsed } = loadEnv({ prefixes: ["VITE_"], mode: envMode });
  const API_PROXY = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:13001";
  const spaOrigin = "http://localhost:18081";
  const idpProxy = createIdpDevProxyMap({
    spaOrigin,
    target: resolveIdpProxyTarget({ ...(parsed ?? {}), ...process.env }),
  });

  return {
    plugins: [pluginReact(), pluginSass()],
    html: {
      template: "./index.html",
    },
    source: {
      entry: {
        index: "./src/main.tsx",
      },
      define: publicVars,
    },
    output: {
      copy: [{ from: "node_modules/blockly/media", to: "blockly/media" }],
    },
    server: {
      port: 18081,
      historyApiFallback: true,
      proxy: {
        // Experience + OIDC must be before `/api` backend proxy.
        ...idpProxy,
        "/api": {
          target: API_PROXY,
          changeOrigin: true,
        },
      },
    },
  };
});
