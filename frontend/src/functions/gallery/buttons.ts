import { encode } from 'modern-gif'
import workerUrl from 'modern-gif/worker?url'
import { LOCALSTORAGE_FPS_KEY, LOCALSTORAGE_SCALE_KEY } from '../../consts.ts';
import { getScaledCanvas } from '../saveImage.ts';
import { DataType, DbAccess } from '../storage/database.ts';

const gallery = document.getElementById("gallery") as HTMLDivElement;
const deleteSelectedBtn = document.getElementById("delete_selected_btn") as HTMLButtonElement;
const selectAllBtn = document.getElementById("select_all_btn") as HTMLButtonElement;
const averageSelectedBtn = document.getElementById("average_selected_btn") as HTMLButtonElement;
const gifSelectedBtn = document.getElementById("gif_selected_btn") as HTMLButtonElement;
const scaleSelect = document.getElementById("download_size") as HTMLSelectElement;
const fpsSelect = document.getElementById("download_fps") as HTMLSelectElement;

export const updateButtons = () => {
  const numSelectedItems = document.querySelectorAll('.marked-for-action').length;
  const numSelectedItemsFinal = document.querySelectorAll('.marked-for-action.final').length;

  deleteSelectedBtn.disabled = numSelectedItems < 1;
  averageSelectedBtn.disabled = numSelectedItems < 2 || numSelectedItemsFinal !== 0;
  gifSelectedBtn.disabled = numSelectedItems < 2 || numSelectedItemsFinal !== 0;

  scaleSelect.value = localStorage.getItem(LOCALSTORAGE_SCALE_KEY) || '1';
  fpsSelect.value = localStorage.getItem(LOCALSTORAGE_FPS_KEY) || '12';
}

export interface GifFrame {
  data: ArrayBufferLike,
  width: number,
  height: number,
  delay: number,
}

interface Dimensions {
  width: number,
  height: number,
}

const unselectAll = () => {
  const markedItems = [...gallery.querySelectorAll('.marked-for-action')] as HTMLLabelElement[];
  for (const item of markedItems) {
    item.classList.remove('marked-for-action');
    const checkbox = item.querySelector('input[type=checkbox]') as HTMLInputElement;
    checkbox.checked = false;
  }

  updateButtons();
};

const selectAll = () => {
  const markedItems = [...gallery.children] as HTMLLabelElement[];
  for (const item of markedItems) {
    item.classList.add('marked-for-action');
    const checkbox = item.querySelector('input[type=checkbox]') as HTMLInputElement;
    checkbox.checked = true;
  }

  updateButtons();
};

const getCommonSize = (images: HTMLImageElement[]): Dimensions | null => {
  if (!images[0]) {
    return null;
  }

  const dimensions: Dimensions = {
    width: images[0].width,
    height: images[0].height,
  }

  for (const image of images) {
    if (dimensions.width != image.width || dimensions.height != image.height) {
      return null;
    }
  }

  return dimensions;
}

export const initButtons = (store: DbAccess) => {
  selectAllBtn.addEventListener('click', () => {
    const items = gallery.children;
    const markedItems = gallery.querySelectorAll('.marked-for-action');

    const unselect = markedItems.length === items.length;

    if (unselect) {
      unselectAll();
    } else {
      selectAll();
    }

    updateButtons();
  });

  deleteSelectedBtn.addEventListener('click', () => {
    const items = [...gallery.querySelectorAll('.marked-for-action')] as HTMLLabelElement[];
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i] as HTMLLabelElement;
      const imageTime = item.dataset.timestamp;
      if (imageTime) {
        store.delete(parseInt(imageTime, 10))
      }
    }

    updateButtons();
  });

  averageSelectedBtn.addEventListener('click', () => {
    const items = [...gallery.querySelectorAll('.marked-for-action img')] as HTMLImageElement[];

    if (items.length < 2) {
      return;
    }

    const dimensions = getCommonSize(items);

    if (!dimensions) {
      alert("Image dimensions must be the same to create an average");
      return;
    }

    const avgCanvas = document.createElement('canvas');
    const avgCtx = avgCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;

    const tmpCanvas = document.createElement('canvas');
    const tmpCtx = tmpCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;

    tmpCanvas.width = dimensions.width;
    tmpCanvas.height = dimensions.height;

    avgCanvas.width = dimensions.width;
    avgCanvas.height = dimensions.height;

    const sumImgData = [];
    const avgImgData = avgCtx.createImageData(avgCanvas.width, avgCanvas.height);

    // Generate average image
    for (const image of items) {
      tmpCtx.drawImage(image, 0, 0);
      const tmpImgData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
      for (let j = 0; j < tmpImgData.data.length; j += 1) {
        if (!sumImgData[j]) {
          sumImgData.push(0);
        }
        sumImgData[j] += tmpImgData.data[j];
      }
    }

    for (let i = 0; i < avgImgData.data.length; i += 1) {
      avgImgData.data[i] = (sumImgData[i] / items.length);
    }

    store.add({
      type: DataType.IMAGE_DATA,
      timestamp: Date.now(),
      data: avgImgData,
    });

    unselectAll();
  });

  gifSelectedBtn.addEventListener('click', async () => {
    const items = [...gallery.querySelectorAll('.marked-for-action img')] as HTMLImageElement[];
    const fps = parseInt(localStorage.getItem(LOCALSTORAGE_FPS_KEY) || '12', 10);
    const delay = Math.floor(1000 / fps);

    if (items.length < 2) {
      return;
    }

    const dimensions = getCommonSize(items);

    if (!dimensions) {
      alert("Image dimensions must be the same to create an animation");
      return;
    }

    const frames: GifFrame[] = items.map((imageSource): GifFrame => {
      const canvas = getScaledCanvas(imageSource, 1)
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      return {
        // need to create imageBuffer here, because a pure canvas cannot be transferred to the worker with modern-gif library
        data: imgData.data.buffer,
        width: canvas.width,
        height: canvas.height,
        delay,
      };
    });

    const output = await encode({
      workerUrl,
      width: dimensions.width,
      height: dimensions.height,
      frames,
    });

    unselectAll();

    const timestamp = Date.now();
    store.add({
      type: DataType.FILE,
      timestamp,
      data: new File([output], `${timestamp}.gif`, { type: 'image/gif' }),
    });
  });

  scaleSelect.addEventListener('change', () => {
    const scale = parseInt(scaleSelect.value || '0', 10) || 1;
    localStorage.setItem(LOCALSTORAGE_SCALE_KEY, scale.toString(10));
  });

  fpsSelect.addEventListener('change', () => {
    const fps = parseInt(fpsSelect.value || '0', 10) || 12;
    localStorage.setItem(LOCALSTORAGE_FPS_KEY, fps.toString(10));
  });

  updateButtons();
}
