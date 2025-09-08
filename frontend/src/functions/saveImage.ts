import { LOCALSTORAGE_SCALE_KEY } from '../consts.ts';
import { getScaledCanvas } from './canvas/getScaledcanvas.ts';
import { getScaledGif } from './canvas/getScaledGif.ts';
import { timeNow, today } from './helpers';

const save = (url: string, fileName: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const  downloadImage = async (image: HTMLImageElement, directFile: boolean) => {
  const scale = parseInt(localStorage.getItem(LOCALSTORAGE_SCALE_KEY) || '1', 10);
  const datetime = new Date();
  const fileName = `image_${today(datetime, '-')}_${timeNow(datetime, '-')}_${scale}x`;

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
