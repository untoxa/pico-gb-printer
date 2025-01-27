import chunk from 'chunk';
import { GifWriter } from 'omggif';

export interface GifFrameData {
  palette: number[],
  pixels: number[],
}

export const imageDatasToBlob = (frames: ImageData[], fps: number): Blob => {
  const buf: number[] = [];
  const gifWriter: GifWriter = new GifWriter(buf, frames[0].width, frames[0].height, { loop: 0xffff });

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

      acc.pixels.push(colorIndex);

      return acc;
    }, { pixels: [], palette: [] });

    gifWriter.addFrame(0, 0, frame.width, frame.height, pixels, {
      delay: Math.round(100 / fps),
      palette,
    });
  }

  const bufferSize = gifWriter.end();

  const file = new Blob(
    [new Uint8Array(buf.slice(0, bufferSize)).buffer],
    { type: 'image/gif' },
  );

  return file;
}
