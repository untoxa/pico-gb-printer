import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '../fs/',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/options': 'http://192.168.7.1/options',
      '/download': 'http://192.168.7.1/download',
      '/reset': 'http://192.168.7.1/reset',
      '/reset_usb_boot': 'http://192.168.7.1/reset_usb_boot',
      '/status.json': 'http://192.168.7.1/status.json',
      '/list.json': 'http://192.168.7.1/list.json',
    }
  },
});
