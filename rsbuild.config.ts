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
      // Array form so `/s/{slug}` cannot prefix-match Rsbuild `/static/*` assets.
      proxy: [
        // Experience + OIDC must be before `/api` backend proxy.
        ...Object.entries(idpProxy).map(([path, options]) => ({
          ...options,
          pathFilter: path,
        })),
        {
          pathFilter: (pathname: string) =>
            pathname === "/s" || pathname.startsWith("/s/"),
          target: API_PROXY,
          changeOrigin: true,
          pathRewrite: { "^/s": "/api/v1/sites" },
        },
        {
          pathFilter: "/api",
          target: API_PROXY,
          changeOrigin: true,
        },
      ],
    },
  };
});
