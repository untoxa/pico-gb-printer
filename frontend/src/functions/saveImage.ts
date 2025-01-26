import { encode } from 'modern-gif'
import workerUrl from 'modern-gif/worker?url'
import { ofetch } from 'ofetch';
import { LOCALSTORAGE_SCALE_KEY } from '../consts.ts';
import { parseGIF, decompressFrames, ParsedFrameWithoutPatch } from 'gifuct-js'
import { GifFrame } from './gallery/buttons.ts';

const today = (date: Date, delim: string): string  => {
  return ((date.getDate() < 10)?"0":"") + date.getDate() + delim + (((date.getMonth()+1) < 10)?"0":"") + (date.getMonth()+1) + delim + date.getFullYear();
};

const timeNow = (date: Date, delim: string): string  => {
  return ((date.getHours() < 10)?"0":"") + date.getHours() + delim + ((date.getMinutes() < 10)?"0":"") + date.getMinutes() + delim + ((date.getSeconds() < 10)?"0":"") + date.getSeconds();
};

const save = (url: string, fileName: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const getScaledCanvas = (
  imageSource: HTMLImageElement | HTMLCanvasElement,
  scaleFactor: number
): HTMLCanvasElement => {
  // Create a new canvas for the scaled output
  const scaledCanvas = document.createElement("canvas");
  const scaledWidth = imageSource.width * scaleFactor;
  const scaledHeight = imageSource.height * scaleFactor;

  scaledCanvas.width = scaledWidth;
  scaledCanvas.height = scaledHeight;

  const scaledContext = scaledCanvas.getContext("2d");
  if (!scaledContext) {
    throw new Error("Failed to get 2D context from scaled canvas.");
  }

  // Disable image smoothing for nearest-neighbor scaling
  scaledContext.imageSmoothingEnabled = false;

  // Scale the source canvas and draw to the new canvas
  scaledContext.drawImage(
    imageSource,
    0, 0, imageSource.width, imageSource.height,
    0, 0, scaledWidth, scaledHeight
  );

  return scaledCanvas;
}

const getScaledGif = async (url: string): Promise<Blob> => {
  const scale = parseInt(localStorage.getItem(LOCALSTORAGE_SCALE_KEY) || '1', 10);

  const gifBlob = await ofetch<Blob>(url);
  const gifBuffer = await gifBlob.arrayBuffer();
  const parsedGif = parseGIF(gifBuffer);
  const frames = decompressFrames(parsedGif, false);

  const { width, height } = frames[0].dims;

  const accCanvas = document.createElement('canvas');
  accCanvas.width = width;
  accCanvas.height = height;
  const accCtx = accCanvas.getContext('2d') as CanvasRenderingContext2D;

  const outFrames = frames.map((frame: ParsedFrameWithoutPatch): GifFrame => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    const imageDataData: number[] = frame.pixels.map((value) => {
      const [r, g, b] = frame.colorTable[value];
      return [r, g, b, value === frame.transparentIndex ? 0 : 255];
    }).flat(1);

    ctx.putImageData(new ImageData(new Uint8ClampedArray(imageDataData), width, height), 0, 0);
    accCtx.drawImage(canvas, 0, 0);

    const result = getScaledCanvas(accCanvas, scale);
    const reultCtx = result.getContext('2d') as CanvasRenderingContext2D;
    const imgData = reultCtx.getImageData(0, 0, result.width, result.height);

    // need to create imageBuffer here, because a pure canvas cannot be transferred to the worker with modern-gif library
    return {
      data: imgData.data.buffer,
      width: width * scale,
      height: height * scale,
      delay: frame.delay,
    };
  });

  const output = await encode({
    workerUrl,
    width: width,
    height: height,
    frames: outFrames,
  });

  return new Blob([output], { type: 'image/gif' });
}

export const  downloadImage = async (image: HTMLImageElement, directFile: boolean) => {
  const scale = parseInt(localStorage.getItem(LOCALSTORAGE_SCALE_KEY) || '1', 10);
  const datetime = new Date();
  const fileName = `image_${today(datetime, "-")}_${timeNow(datetime, "-")}_${scale}x`;

  if (directFile) {
    const scaledGif = await getScaledGif(image.src);
    const url = URL.createObjectURL(scaledGif);
    save(url, `${fileName}.gif`);
  } else {
    const canvas = getScaledCanvas(image, scale);
    canvas.toBlob((blob: Blob | null): void => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        save(url, `${fileName}.png`);
        URL.revokeObjectURL(url);
      }
    }, 'png');
  }
}
