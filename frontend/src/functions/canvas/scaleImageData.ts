import { getScaledCanvas } from './getScaledcanvas.ts';

export const scaleImageData = (scale: number, sourceImageData: ImageData): ImageData => {
  const canvas = document.createElement('canvas');
  canvas.width = sourceImageData.width;
  canvas.height = sourceImageData.height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  ctx.putImageData(sourceImageData, 0, 0);
  const result = getScaledCanvas(canvas, scale);
  const resultCtx = result.getContext('2d') as CanvasRenderingContext2D;
  return resultCtx.getImageData(0, 0, result.width, result.height);
}
