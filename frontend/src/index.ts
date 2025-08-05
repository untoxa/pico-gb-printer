import { initGallery } from './functions/gallery';
import { initSettings } from './functions/settings';
import { initDb } from './functions/storage/database.ts';
import { initLiveView } from "./functions/liveView";
import { startPolling } from './functions/pollLoop.ts';
import { webappConnect } from './functions/remote/webappConnect.ts';

import 'reset-css/reset.css';
import './style.css';

(async () => {
  let store = await initDb();

  if (window.location.pathname === '/remote.html') {
    if (window.opener) {
      await webappConnect(store, window.opener);
    }
  } else {
    store = initLiveView(store);
    await initSettings(store);
    await initGallery(store);
  }

  startPolling(store);
})();
