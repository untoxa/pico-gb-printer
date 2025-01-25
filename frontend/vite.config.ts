import { defineConfig } from 'vite';
import { $fetch } from 'ofetch';

export default defineConfig({
  build: {
    outDir: '../fs/',
    emptyOutDir: true,
  },
  plugins: [
    {
      name: 'custom-fetch-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const targetUrl = 'http://192.168.7.1';
          if (['/list.json', '/status.json'].includes(req.url)) {
            try {
              const url = `${targetUrl}${req.url}`;
              const targetResponse = await $fetch.raw(url, { method: 'GET', responseType: 'arrayBuffer', ignoreResponseError: true });
              res.statusCode = targetResponse.status;
              targetResponse.headers.forEach((value, name) => res.setHeader(name, value));
              res.end(new Uint8Array(targetResponse._data));
            } catch (error) {
              console.error('Fetch proxy error:', error);
              res.statusCode = 500;
              res.end('Internal Server Error');
            }
          } else {
            next();
          }
        });
      },
    },
  ],
  server: {
    port: 3000,
  },
});
