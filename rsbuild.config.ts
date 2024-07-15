import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig(({ envMode }) => {
  const { publicVars } = loadEnv({ prefixes: ['VITE_'], mode: envMode });
  const API_PROXY = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:13001';

  return {
    plugins: [pluginReact()],
    html: {
      template: './index.html',
    },
    source: {
      entry: {
        index: './src/main.tsx',
      },
      define: publicVars,
    },
    server: {
      port: 18081,
      historyApiFallback: true,
      proxy: {
        '/api': {
          target: API_PROXY,
          changeOrigin: true,
        },
      },
    },
  };
});
