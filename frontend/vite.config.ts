import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // allow access via custom local domain (e.g., modernreader.local)
    port: 5173,
    // Allow external hosts (e.g., Cloudflare Quick Tunnel) in dev
    // Note: This disables host checking in dev only; do NOT use in production builds
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
    },
  },
});
