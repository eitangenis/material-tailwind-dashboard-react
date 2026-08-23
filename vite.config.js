import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';

export default defineConfig({
  plugins: [
    {
      name: 'exclude-git-directory',
      enforce: 'pre',
      resolveId(id) {
        // Exclude anything in .git directory
        if (id.includes('.git' + path.sep) || id.includes('.git/')) {
          return { id, external: true };
        }
      },
      async transform(code, id) {
        // Prevent processing of .git files
        if (id.includes('.git' + path.sep) || id.includes('.git/')) {
          return '';
        }
      }
    },
    react(),
  ],
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
  define: {
    'process.env': {},
    global: 'window',
  },
  optimizeDeps: {
    exclude: ['.git']
  },
  server: {
    host:'0.0.0.0',
    allowedHosts: ['app.pyxis-discovery.com', 'localhost', '127.0.0.1'],
    https: false,
    port: 5173,
    // This legacy app is temporarily served by Vite in production. Internet scanners
    // deliberately request nonexistent /@fs paths; Vite broadcasts those unrelated
    // server errors to every connected visitor unless the development overlay is off.
    hmr: {
      overlay: false,
    },
    headers: {
      'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data: https://js.stripe.com https://cdn.jsdelivr.net https://api.nepcha.com https://3dmol.csb.pitt.edu https://unpkg.com; worker-src 'self' blob: data:"
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001', // Use IPv4 instead of localhost
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      ignored: ['**/.git/**', '**/node_modules/**', '**/.env*', '**/dist/**', '**/.git']
    },
    fs: {
      strict: true,
      allow: ['.'],
      // server.fs.deny REPLACES Vite's defaults rather than extending them, and the
      // defaults are what block .env. Overriding it with only the .git patterns therefore
      // served https://app.pyxis-discovery.com/.env — in full, publicly — to anyone who
      // asked. Restored here, .git kept. Secrets now live in
      // /root/pyxis-secrets/stripe-server.env, outside this directory entirely; this is
      // the second line of defence, not the first.
      deny: ['.env', '.env.*', '*.{crt,pem,key}', 'custom.secret', '.git', '.git/**']
    }
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Exclude .git directory and only externalize actual npm packages
        if (id.includes('.git' + path.sep) || id.includes('.git/')) return true;
        return /^[^.\/]/.test(id);
      },
      output: {
        // Ensure .git files are never included in output
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.includes('.git')) {
            return '[name].[ext]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});
