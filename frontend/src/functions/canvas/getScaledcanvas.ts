export const getScaledCanvas = (
  imageSource: HTMLImageElement | HTMLCanvasElement,
  scaleFactor: number
): HTMLCanvasElement => {
  // Create a new canvas for the scaled output
  const scaledCanvas = document.createElement('canvas');
  const scaledWidth = imageSource.width * scaleFactor;
  const scaledHeight = imageSource.height * scaleFactor;

  scaledCanvas.width = scaledWidth;
  scaledCanvas.height = scaledHeight;

  const scaledContext = scaledCanvas.getContext('2d');
  if (!scaledContext) {
    throw new Error('Failed to get 2D context from scaled canvas.');
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
