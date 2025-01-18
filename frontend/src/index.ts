import { ofetch } from 'ofetch';
import { DOWNLOAD } from './consts.js';
import { getCameraImage } from "./functions/getCameraImage.js";
import { initButtons } from "./functions/initButtons.js";
import { initDb } from "./functions/database.js";

const MAX_POLL_DELAY = 1000;
const BASIC_POLL_DELAY  = 10;

// interface StatusResponse {
//   options: {
//     debug: 'on' | 'off'
//   },
//   result: string,
//   status: {
//     'received:' : number,
//   },
//   system: {
//     fast: boolean,
//     buffer_size: number,
//   },
// }

(async () => {

  const store = await initDb();
  const workingCanvas = document.createElement('canvas');

  let pollDelay = BASIC_POLL_DELAY;

  const pollDownload = async () => {
    try {
      const downloadResponse = await ofetch.raw(DOWNLOAD, {
        method: 'GET',
        responseType: 'arrayBuffer',
        ignoreResponseError: true,
      });

      if (downloadResponse.status === 200 && downloadResponse._data?.byteLength) {
        const dlData = {
          timestamp: Date.now(),
          data: new Uint8Array(downloadResponse._data),
        };

        store.add(dlData);

        getCameraImage(workingCanvas, dlData);

        pollDelay = BASIC_POLL_DELAY;
      } else { // 404 case
        pollDelay = Math.min(MAX_POLL_DELAY, Math.ceil(pollDelay * 1.5));
      }
    } catch { // network error case
      pollDelay = Math.min(MAX_POLL_DELAY, Math.ceil(pollDelay * 5));
    }

    console.log(pollDelay);
    window.setTimeout(pollDownload, pollDelay);
  };

  const all = await store.getAll();

  for (const dlData of all) {
    const validImage = await getCameraImage(workingCanvas, dlData);
    if (!validImage) {
      store.delete(dlData.timestamp);
    }
  }

  pollDownload();
  initButtons(store);
})();
