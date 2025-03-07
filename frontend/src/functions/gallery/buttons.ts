import chunk from 'chunk';
import { Direction, LOCALSTORAGE_FPS_KEY, LOCALSTORAGE_GIF_DIR_KEY } from '../../consts.ts';
import { imageDatasToBlob } from '../canvas/imageDatasToBlob.ts';
import { showToast } from '../settings/toast.ts';
import { DataType, DbAccess } from '../storage/database.ts';
import { sortBySelectionOrder, updateSelectionOrder } from './selectionOrder.ts';

const gallery = document.getElementById("gallery") as HTMLDivElement;
const deleteSelectedBtn = document.getElementById("delete_selected_btn") as HTMLButtonElement;
const selectAllBtn = document.getElementById("select_all_btn") as HTMLButtonElement;
const averageSelectedBtn = document.getElementById("average_selected_btn") as HTMLButtonElement;
const gifSelectedBtn = document.getElementById("gif_selected_btn") as HTMLButtonElement;
const rgbSelectedBtn = document.getElementById("rgb_selected_btn") as HTMLButtonElement;


export const updateButtons = () => {
  const numSelectedItems = document.querySelectorAll('.marked-for-action').length;
  const numSelectedItemsFinal = document.querySelectorAll('.marked-for-action.final').length;

  deleteSelectedBtn.disabled = numSelectedItems < 1;
  averageSelectedBtn.disabled = numSelectedItems < 2 || numSelectedItemsFinal !== 0;
  gifSelectedBtn.disabled = numSelectedItems < 2 || numSelectedItemsFinal !== 0;
  rgbSelectedBtn.disabled = numSelectedItems !== 3 || numSelectedItemsFinal !== 0;
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
    updateSelectionOrder();
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
      showToast('Image dimensions must be the same for all selected images to create an average');
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
    const items = [...gallery.querySelectorAll('.marked-for-action')] as HTMLDivElement[];
    const fps = parseInt(localStorage.getItem(LOCALSTORAGE_FPS_KEY) || '12', 10);
    const dir = localStorage.getItem(LOCALSTORAGE_GIF_DIR_KEY) as Direction || Direction.FORWARD;

    if (items.length < 2) {
      return;
    }

    items.sort(sortBySelectionOrder((gallery.children.length + 1).toString(10)));

    const images = items.map((item) => item.querySelector('img'))  as HTMLImageElement[];

    const dimensions = getCommonSize(images);

    if (!dimensions) {
      showToast('Image dimensions must be the same for all selected images to create an animation');
      return;
    }

    const frames: ImageData[] = images.map((imageSource): ImageData => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      canvas.width = imageSource.naturalWidth;
      canvas.height = imageSource.naturalHeight;
      ctx.drawImage(imageSource, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    });

    switch (dir) {
      case Direction.FORWARD:
        break;

      case Direction.REVERSE:
        frames.reverse();
        break;

      case Direction.YOYO: {
        if (frames.length > 2) {
          frames.push(...frames.slice(1, -1).reverse());
        }
        break;
      }

      default:
        break;
    }


    const timestamp = Date.now();
    store.add({
      type: DataType.BLOB,
      timestamp,
      data: await imageDatasToBlob(frames, fps),
    });

    unselectAll();
  });

  rgbSelectedBtn.addEventListener('click', async () => {
    const items = [...gallery.querySelectorAll('.marked-for-action')] as HTMLDivElement[];

    if (items.length !== 3) {
      return;
    }

    items.sort(sortBySelectionOrder((gallery.children.length + 1).toString(10)));

    const images = items.map((item) => item.querySelector('img'))  as HTMLImageElement[];

    const dimensions = getCommonSize(images);

    if (!dimensions) {
      showToast('Image dimensions must be the same for all selected images to create a RGB image');
      return;
    }

    const [pixelsR, pixelsG, pixelsB]: number[][][] = images.map((imageSource): number[][] => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      ctx.drawImage(imageSource, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return chunk(imageData.data, 4);
    });

    const pixels = new Array(dimensions.width * dimensions.height)
      .fill(null)
      .map((_, pixelIndex) => {
        const [rr, rg, rb] = pixelsR[pixelIndex];
        const [gr, gg, gb] = pixelsG[pixelIndex];
        const [br, bg, bb] = pixelsB[pixelIndex];

        const r = Math.floor((rr + rg + rb) / 3);
        const g = Math.floor((gr + gg + gb) / 3);
        const b = Math.floor((br + bg + bb) / 3);

        return [r, g, b, 255];
      })
      .flat(1);

    const rgbImageData = new ImageData(new Uint8ClampedArray(pixels), dimensions.width, dimensions.height);

    store.add({
      type: DataType.IMAGE_DATA,
      timestamp: Date.now(),
      data: rgbImageData,
    });

    unselectAll();
  });

  updateButtons();
}
