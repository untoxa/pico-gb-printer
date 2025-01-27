import { ofetch } from 'ofetch';
import { GifReader } from 'omggif';
import { LOCALSTORAGE_SCALE_KEY } from '../../consts.ts';
import { imageDatasToFile } from './imageDatasToFile.ts';
import { scaleImageData } from './scaleImageData.ts';

export const getScaledGif = async (url: string): Promise<File> => {
  const scale = parseInt(localStorage.getItem(LOCALSTORAGE_SCALE_KEY) || '1', 10);

  const gifBlob = await ofetch<Blob>(url);
  const gifBuffer = await gifBlob.arrayBuffer();
  const intArray = new Uint8Array(gifBuffer);
  const reader = new GifReader(intArray as Buffer);

  const info = reader.frameInfo(0);
  const fps = Math.round(100 / info.delay);

  const frames: ImageData[] = new Array(reader.numFrames()).fill(0).map((_, k) => {
    const image = new ImageData(info.width, info.height);
    reader.decodeAndBlitFrameRGBA(k, image.data as any);
    return scaleImageData(scale, image);
  });

  return imageDatasToFile(frames, fps);
}
