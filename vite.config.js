import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
  server: {
    https: true,
    proxy: {
      '/api': {
        target: 'https://api.chemtest.tech:5000',
        changeOrigin: true,
        secure: false, // Accept self-signed certificates
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});