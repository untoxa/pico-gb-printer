import {TILE_HEIGHT, TILE_SIZE} from "../consts.js";
import {resizeCanvas} from "./resizeCanvas.js";

export const render = (
  canvas: HTMLCanvasElement,
  image_data: Uint8Array,
  image_start: number,
  image_end: number,
  image_tile_width: number,
  margin: number,
  palette: number,
  exposure: number,
): boolean => {
  const pal = new Uint8Array(4);
  pal[0] = ((exposure * ((palette >> 0) & 0x03)) / 3) >> 0;
  pal[1] = ((exposure * ((palette >> 2) & 0x03)) / 3) >> 0;
  pal[2] = ((exposure * ((palette >> 4) & 0x03)) / 3) >> 0;
  pal[3] = ((exposure * ((palette >> 6) & 0x03)) / 3) >> 0;

  let tile_y = ((canvas.height / TILE_HEIGHT) >> 0);
  let tile_x = 0;

  resizeCanvas(canvas, (image_tile_width * 8), ((canvas.height >> 3) << 3) + ((Math.max(0, image_end - image_start) / (TILE_SIZE * image_tile_width)) >> 0) * 8)

  if (canvas.width * canvas.height !== 0) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const writeData = imageData.data;
    for (let i = image_start; i < image_end; ) {
      for (let t = 0; t < 8; t++) {
        let b1 = image_data[i++];
        let b2 = image_data[i++];
        for (let b = 0; b < 8; b++) {
          let offset = (((tile_y << 3) + t) * canvas.width + (tile_x << 3) + b) << 2;
          let color_index = ((b1 >> (7 - b)) & 1) | (((b2 >> (7 - b)) & 1) << 1);

          writeData[offset] = writeData[offset + 1] = writeData[offset + 2] = 0xFF - pal[color_index];
          writeData[offset + 3] = 0xff;
        }
      }
      tile_x += 1;
      if (tile_x >= image_tile_width) {
        tile_x = 0;
        tile_y++;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return ((margin & 0x0f) != 0);
}
