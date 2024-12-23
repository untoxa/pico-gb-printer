import { DOWNLOAD } from "./consts.js";
import { getCameraImage } from "./functions/getCameraImage.js";
import { initButtons } from "./functions/initButtons.js";
import { initDb } from "./functions/database.js";
const STATUS_POLL_DELAY = 1000;
const STATUS_POLL_NEXT  = 10;
const store = await initDb();
const workingCanvas = document.createElement('canvas');
const getStatus = async () => {
    try {
        const downloadResponse = await fetch(DOWNLOAD);
        if (downloadResponse.status == 200) {
            const downloadBody = await downloadResponse.blob();
            const downloadBuffer = await downloadBody.arrayBuffer();
            const downloadData = new Uint8Array(downloadBuffer);
            const dlData = {
                timestamp: Date.now(),
                data: downloadData,
            };
            store.add(dlData);
            getCameraImage(workingCanvas, dlData);
            const to = window.setTimeout(getStatus, STATUS_POLL_NEXT);
        } else {
            const to = window.setTimeout(getStatus, STATUS_POLL_DELAY);
        }
    } catch(e) {
        const to = window.setTimeout(getStatus, STATUS_POLL_DELAY);
    }
};
const all = await store.getAll();
all.forEach((dlData) => {
    console.log(dlData.data.byteLength);
    getCameraImage(workingCanvas, dlData);
});
getStatus();
initButtons(store);
