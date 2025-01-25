import { LOCALSTORAGE_SCALE_KEY } from '../consts.ts';

const today = (date: Date, delim: string): string  => {
  return ((date.getDate() < 10)?"0":"") + date.getDate() + delim + (((date.getMonth()+1) < 10)?"0":"") + (date.getMonth()+1) + delim + date.getFullYear();
}

const timeNow = (date: Date, delim: string): string  => {
  return ((date.getHours() < 10)?"0":"") + date.getHours() + delim + ((date.getMinutes() < 10)?"0":"") + date.getMinutes() + delim + ((date.getSeconds() < 10)?"0":"") + date.getSeconds();
}

const format = (str: string, ...rest: string[]): string => {
  var formatted = str;
  for (var i = 0; i < rest.length; i++) {
    var regexp = new RegExp('\\{'+i+'\\}', 'gi');
    formatted = formatted.replace(regexp, rest[i]);
  }
  return formatted;
};

const getScaledCanvas = (
  imageSource: HTMLImageElement,
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

export const  downloadImage = async (image: HTMLImageElement) => {
  const scale = parseInt(localStorage.getItem(LOCALSTORAGE_SCALE_KEY) || '1', 10);
  const datetime = new Date();
  const file_name = format("image_{0}_{1}.png", today(datetime, "-"), timeNow(datetime, "-"));

  const canvas = getScaledCanvas(image, scale);

  // Fallback to simple download
  const xhr = new XMLHttpRequest();
  xhr.responseType = "blob";
  xhr.onload = function () {
    const a = document.createElement("a");
    a.href = window.URL.createObjectURL(xhr.response);
    a.download = file_name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  xhr.open("GET", canvas.toDataURL());
  xhr.send();
}
