import path from 'path';
import fs from 'fs';
import type { ServerOptions as HttpsServerOptions } from 'node:https';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const useHttps = env.VITE_DEV_HTTPS === 'true';
    const httpsConfig: boolean | HttpsServerOptions | undefined = (() => {
      if (!useHttps) return undefined;
      const keyPath = env.VITE_DEV_SSL_KEY;
      const certPath = env.VITE_DEV_SSL_CERT;
      if (keyPath && certPath && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) } as HttpsServerOptions;
      }
      // 沒提供 key/cert 時，使用自簽憑證（由 Vite 內建產生）
      return true;
    })();

    return {
      server: {
        port: 3000,
        strictPort: true,
        host: '0.0.0.0',
        // 轉型避免型別衝突（Vite 實作支援 boolean | HttpsServerOptions）
        https: httpsConfig as any,
        proxy: {
          '/sdapi': {
            target: 'http://localhost:7860',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/sdapi/, '/sdapi'),
          },
          '/ttsapi': {
            target: 'http://localhost:5002',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/ttsapi/, '/api'),
          },
          '/sttapi': {
            target: 'http://localhost:5003',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/sttapi/, '/api'),
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
