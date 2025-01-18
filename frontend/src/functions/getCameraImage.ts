import {
  CAMERA_WIDTH,
  COMMAND_DATA,
  COMMAND_INIT,
  COMMAND_PRINT,
  COMMAND_TRANSFER,
  PRINTER_WIDTH
} from "../consts.js";
import { appendCanvasToGallery } from "./appendCanvasToGallery.js";
import { resetCanvas } from "./resetCanvas.js";
import {decode} from "./decode.js";
import {render} from "./render.js";
import type { DownloadData } from "./database.js";

export async function getCameraImage(canvas: HTMLCanvasElement, dlData: DownloadData) {
  const resData = dlData.data;
  const data_size = resData.byteLength;

  const processed_data = new Uint8Array(Math.max(1024*1024, data_size));

  resetCanvas(canvas);

  let buffer_start = 0;
  let ptr = 0;
  let idx = 0;
  let len = 0;
  while (idx < data_size) {
    const command = resData[idx++];
    switch(command) {
      case COMMAND_INIT:
        break;
      case COMMAND_PRINT: {
        if ((len = resData[idx++] | (resData[idx++] << 8)) != 4) {
          idx = data_size;
          break;
        }

        // @ts-ignore
        let sheets = resData[idx++];
        let margins = resData[idx++];
        let palette = resData[idx++];
        let exposure = Math.min(0xFF, 0x80 + resData[idx++]);

        palette = (palette) ? palette : 0xE4;

        if (render(canvas, processed_data, buffer_start, ptr, PRINTER_WIDTH, margins, palette, exposure)) {
          appendCanvasToGallery(canvas, dlData.timestamp);
          resetCanvas(canvas);
        }
        buffer_start = ptr;

        break;
      }

      case COMMAND_TRANSFER: {
        len = resData[idx++] | (resData[idx++] << 8);
        let current_image_start = ptr;
        ptr = decode(false, resData, data_size, len, idx, processed_data, ptr);
        idx += len;
        render(canvas, processed_data, current_image_start, ptr, CAMERA_WIDTH, 0x03, 0xE4, 0xFF);
        appendCanvasToGallery(canvas, dlData.timestamp);
        resetCanvas(canvas);
        buffer_start = ptr;
        break;
      }

      case COMMAND_DATA: {
        const compression = !!resData[idx++];
        len = resData[idx++] | (resData[idx++] << 8);
        ptr = decode(compression, resData, data_size, len, idx, processed_data, ptr);
        idx += len;
        break;
      }
      default:
        idx = data_size;
        break;
    }
  }

  if (canvas.height > 1) {
    appendCanvasToGallery(canvas, dlData.timestamp);
    resetCanvas(canvas);
  }
}
