import { updateButtons } from "./updateButtons.js";
import { downloadImage } from "./saveImage.js";

const gallery = document.getElementById("gallery") as HTMLDivElement;

export const appendCanvasToGallery = (canvas: HTMLCanvasElement, timestamp?: number): boolean => {
  if (canvas.height > 1) {
    const imageContainer = document.createElement("label");
    imageContainer.classList.add("gallery-image");

    const img = new Image();
    img.src = canvas.toDataURL();
    imageContainer.appendChild(img);

    if (timestamp) {
      imageContainer.dataset.timestamp = timestamp.toString(10);
    }

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
    btn.textContent = "Save";
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
