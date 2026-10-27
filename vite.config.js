import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Runs the files in /api as serverless functions during `npm run dev` (same code Vercel runs in production).
function devApi(env) {
  return {
    name: 'dev-api',
    configureServer(server) {
      Object.assign(process.env, env);
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        const name = req.url.split('?')[0].replace(/^\/api\//, '').replace(/[^a-z0-9-]/gi, '');
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`);
          let raw = ''; for await (const c of req) raw += c;
          req.body = raw ? JSON.parse(raw) : undefined;
          res.status = (c) => { res.statusCode = c; return res; };
          res.json = (b) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(b)); };
          await mod.default(req, res);
        } catch (e) { console.error(e); res.statusCode = 500; res.end(JSON.stringify({ error: 'dev_api_error' })); }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    devApi(loadEnv(mode, process.cwd(), '')),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Resume Generator Pro', short_name: 'Resume Pro', description: 'Tailored, ATS-friendly resumes and cover letters. Works offline.',
        theme_color: '#0e1726', background_color: '#eef1f4', display: 'standalone', start_url: '/', scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // precache the app shell, fonts (latin only) and the lazy PDF/DOCX parsers so importing works offline too
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,mjs}'],
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
}));
