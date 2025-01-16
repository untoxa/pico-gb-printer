import {DOWNLOAD, RESET, STATUS_FILE} from "./consts.js";
import { getCameraImage } from "./functions/getCameraImage.js";
import { initButtons } from "./functions/initButtons.js";
import { initDb } from "./functions/database.js";

const STATUS_POLL_DELAY = 1000;

interface StatusResponse {
  options: {
    debug: 'on' | 'off'
  },
  result: string,
  status: {
    'received:' : number,
  },
  system: {
    fast: boolean,
    buffer_size: number,
  },
}

const store = await initDb();
const workingCanvas = document.createElement('canvas');

const getStatus = async () => {
  const responseStatus = await fetch(STATUS_FILE);
  const dataStatus: StatusResponse = await responseStatus.json();

  if (dataStatus.status["received:"] > 0) {
    const downloadResponse = await fetch(DOWNLOAD);
    const downloadBody = await downloadResponse.blob();
    const downloadBuffer = await downloadBody.arrayBuffer();
    const downloadData = new Uint8Array(downloadBuffer);

    const dlData = {
      timestamp: Date.now(),
      data: downloadData,
    }

    store.add(dlData);

    getCameraImage(workingCanvas, dlData);

    const responseClear = await fetch(RESET);
    const dataClear = await responseClear.json();
    if (dataClear.result !== "ok") {
      console.error('data not cleared', dataClear);
    }
  }

  window.setTimeout(getStatus, STATUS_POLL_DELAY)
}


const all = await store.getAll();
all.forEach((dlData) => {
  console.log(dlData.data.byteLength)
  getCameraImage(workingCanvas, dlData);
});

getStatus();
initButtons(store);
