import { initGallery } from './functions/gallery';
import { initDb } from './functions/storage/database.ts';
import { startPolling } from './functions/pollLoop.ts';
import { webappConnect } from './functions/remote/webappConnect.ts';

(async () => {
  const store = await initDb();

  if (window.location.pathname === '/remote.html') {
    if (window.opener) {
      await webappConnect(store, window.opener);
    }
  } else {
    await initGallery(store);
  }

  startPolling(store);
})();
