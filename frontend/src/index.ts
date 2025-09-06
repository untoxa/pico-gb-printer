import { initGallery } from './functions/gallery';
import { initSettings } from './functions/settings';
import { initDb } from './functions/storage/database.ts';
import { initLiveView } from './functions/liveView';
import { initRemoteControl } from './functions/remoteControl';
import { startPolling } from './functions/pollLoop.ts';
import { webappConnect } from './functions/remote/webappConnect.ts';

import 'reset-css/reset.css';
import './style.scss';

(async () => {
  let store = await initDb();

  switch (window.location.pathname) {
    case '/remote.html': {
      if (window.opener) {
        await webappConnect(store, window.opener);
      }
      break;
    }

    default: {
      store = initLiveView(store);
      await initSettings(store);
      await initGallery(store);
      await initRemoteControl();
    }
  }

  startPolling(store);
})();
