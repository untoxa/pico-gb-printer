import { updateButtons } from './buttons.ts';
import { downloadImage } from '../saveImage.ts';

const gallery = document.getElementById("gallery") as HTMLDivElement;

export const addImageDataToGallery = (imageData: ImageData, timestamp: number): boolean => {
  if (imageData.height * imageData.width > 1) {
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.putImageData(imageData, 0, 0)

    const imageContainer = document.createElement("label");
    imageContainer.classList.add("gallery-image");

    const img = new Image();
    img.src = canvas.toDataURL();
    imageContainer.appendChild(img);

    imageContainer.dataset.timestamp = timestamp.toString(10);

    const input = document.createElement("input");
    input.setAttribute("type", "checkbox");

    input.addEventListener("change", function() {
      if (input.checked) {
        imageContainer.classList.add('marked-for-action');
      } else {
        imageContainer.classList.remove('marked-for-action');
      }

      updateButtons();
    });

    imageContainer.appendChild(input);

    const btn = document.createElement("button");
    btn.innerHTML = "<span>Save</span>";
    btn.addEventListener("click", function () {
      downloadImage(img);
    });
    imageContainer.appendChild(btn);

    gallery.appendChild(imageContainer);
    updateButtons();

    return true;
  }

  return false;
}
