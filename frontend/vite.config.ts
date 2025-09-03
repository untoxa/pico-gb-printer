import * as fs from 'fs';
import * as path from 'path';
import { defineConfig } from 'vite';
import { $fetch } from 'ofetch';

const input = fs.readdirSync(__dirname)
  .reduce((acc: string[], file) => {
    const filePath = path.join(__dirname, file);
    const stats = fs.statSync(filePath);

    if (!stats.isDirectory() && path.extname(file) === ".html") {
      return [...acc, path.resolve(filePath)];
    }

    return acc;
  }, []);

export default defineConfig({
  build: {
    outDir: '../fs/',
    emptyOutDir: true,
    rollupOptions: {
      input,
    }
  },
  plugins: [
    {
      name: 'custom-fetch-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const targetUrl = 'http://192.168.7.1';
          if (
            req.url === '/download' ||
            req.url === '/status.json' ||
            req.url.startsWith('/click')
          ) {
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
