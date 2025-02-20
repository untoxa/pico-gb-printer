import chunk from 'chunk';
import { GifWriter } from 'omggif';
import { delay } from '../delay.ts';
import { showToast } from '../settings/toast.ts';

export interface GifFrameData {
  palette: number[],
  pixels: number[],
}

const progressBackdrop = document.getElementById('progress_backdrop') as HTMLDivElement;
const progressInner = document.querySelector('.progress-inner') as HTMLDivElement;

export const imageDatasToBlob = async (frames: ImageData[], fps: number): Promise<Blob> => {
  progressBackdrop.classList.add('visible');
  await delay(1);

  const buf: number[] = [];
  const gifWriter: GifWriter = new GifWriter(buf, frames[0].width, frames[0].height, { loop: 0xffff });

  let frameCount = 0;

  for (const frame of frames) {
    const {
      palette,
      pixels,
    } = chunk(frame.data, 4).reduce((acc: GifFrameData, [r, g, b]): GifFrameData => {
      // eslint-disable-next-line no-bitwise
      const color: number = (r << 16) + (g << 8) + b;
      let colorIndex: number = acc.palette.findIndex((c) => c === color);
      if (colorIndex === -1) {
        colorIndex = acc.palette.length;
        acc.palette.push(color);
      }

      if (colorIndex > 256) {
        colorIndex = 0;
      }

      acc.pixels.push(colorIndex);

      return acc;
    }, { pixels: [], palette: [] });

    const p = [
      ...palette,
      ...(new Array(256).fill(0)),
    ].slice(0, 256);

    if (palette.length <= 256) {
      progressInner.style.width = `${Math.floor(frameCount / frames.length * 100)}%`;
      frameCount += 1;
      await delay(1);
      gifWriter.addFrame(0, 0, frame.width, frame.height, pixels, {
        delay: Math.round(100 / fps),
        palette: p,
      });
    }
  }

  if (frameCount !== frames.length) {
    const msg = 'Some frames in your image contain more than 256 colors, which makes creating a GIF impossible';
    showToast(msg);
    throw new Error(msg);
  }

  const bufferSize = gifWriter.end();

  const file = new Blob(
    [new Uint8Array(buf.slice(0, bufferSize)).buffer],
    { type: 'image/gif' },
  );

  progressBackdrop.classList.remove('visible');
  progressInner.style.width = '0';
  return file;
}
