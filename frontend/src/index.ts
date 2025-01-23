import { getCameraImage } from './functions/decoding/getCameraImage.ts';
import { initButtons } from './functions/gallery/initButtons.ts';
import { initDb } from './functions/storage/database.ts';
import { startPolling } from './functions/pollLoop.ts';
import { webappConnect } from './functions/remote/webappConnect.ts';

(async () => {

  const store = await initDb();
  const workingCanvas = document.createElement('canvas');

  const storedImages = await store.getAll();

  for (const dlData of storedImages) {
    const validImage = await getCameraImage(workingCanvas, dlData);
    if (!validImage) {
      store.delete(dlData.timestamp);
    }
  }

  startPolling(workingCanvas, store);
  initButtons(store);

  if (window.location.pathname === '/remote.html' && window.opener !== null) {
    webappConnect(store, window.opener);
  }
})();
