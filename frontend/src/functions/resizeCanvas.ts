export const resizeCanvas = (canvas: HTMLCanvasElement, new_w: number, new_h: number) => {
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  let temp = ctx.getImageData(0, 0, canvas.width, canvas.height)
  canvas.width = new_w;
  canvas.height = new_h;
  ctx.putImageData(temp, 0, 0);
}
