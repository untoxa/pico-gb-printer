import { SortOrder } from '../../consts.ts';
import { downloadImage } from '../saveImage.ts';
import { getSortOrder } from '../settings';
import { updateButtons } from './buttons.ts';
import { updateSelectionOrder } from './selectionOrder.ts';
import './gallery-item.scss';

export const MARKER = 'gallery-item--marked-for-action';

const gallery = document.querySelector('.gallery') as HTMLDivElement;

const addImage = (image: HTMLDivElement): void => {
  if (getSortOrder() === SortOrder.ASCENDING && gallery.firstElementChild) {
    gallery.insertBefore(image, gallery.firstElementChild);
  } else {
    gallery.appendChild(image);
  }
};

const createGalleryItem = (imgSrc: string, timestamp: number, isFinal: boolean) => {
  const imageContainer = document.createElement('div');
  imageContainer.classList.add('gallery-item');
  imageContainer.dataset.timestamp = timestamp.toString(10);

  if (isFinal) {
    imageContainer.classList.add('final');
  }

  const img = new Image();
  img.src = imgSrc;

  const label = document.createElement('label');
  label.classList.add('gallery-item__label');
  label.appendChild(img);

  imageContainer.appendChild(label);

  const input = document.createElement('input');
  input.classList.add('gallery-item__input');
  input.setAttribute('type', 'checkbox');

  input.addEventListener('change', function() {
    if (input.checked) {
      imageContainer.classList.add(MARKER);
    } else {
      imageContainer.classList.remove(MARKER);
    }

    updateButtons();
    updateSelectionOrder(imageContainer);
  });

  label.appendChild(input);

  const btn = document.createElement('button');
  btn.classList.add('gallery-item__button');
  btn.innerHTML = '<span>Save</span>';
  btn.addEventListener('click', function () {
    downloadImage(img, isFinal);
  });
  imageContainer.appendChild(btn);

  addImage(imageContainer);
  updateButtons();
}

export const addImageDataToGallery = async (imageData: ImageData, timestamp: number): Promise<void> => (
  new Promise((resolve) => {

    if (imageData.height * imageData.width > 1) {
      const canvas = document.createElement('canvas') as HTMLCanvasElement;
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          createGalleryItem(url, timestamp, false);
        }

        resolve();
      });
    }
  })
);

export const addBlobToGallery = async (blob: Blob, timestamp: number): Promise<void> => {
  const url = URL.createObjectURL(blob);
  createGalleryItem(url, timestamp, true);
}
