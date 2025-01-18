import { DOWNLOAD } from './consts.js';
import { getCameraImage } from "./functions/getCameraImage.js";
import { initButtons } from "./functions/initButtons.js";
import { initDb } from "./functions/database.js";

const STATUS_POLL_DELAY = 100000;
const STATUS_POLL_NEXT = 10000;

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

  const getStatus = async () => {
    try {
      const downloadResponse = await fetch(DOWNLOAD);
      if (downloadResponse.status === 200) {
        const downloadBody = await downloadResponse.blob();
        const downloadBuffer = await downloadBody.arrayBuffer();
        const downloadData = new Uint8Array(downloadBuffer);

        const dlData = {
          timestamp: Date.now(),
          data: downloadData,
        };

        store.add(dlData);

        getCameraImage(workingCanvas, dlData);

        window.setTimeout(getStatus, STATUS_POLL_NEXT);
      } else {
        window.setTimeout(getStatus, STATUS_POLL_DELAY);
      }
    } catch {
      window.setTimeout(getStatus, STATUS_POLL_DELAY);
    }
  };

  const all = await store.getAll();
  all.forEach((dlData) => {
    console.log(dlData.data.byteLength)
    getCameraImage(workingCanvas, dlData);
  });

  getStatus();
  initButtons(store);
})();
