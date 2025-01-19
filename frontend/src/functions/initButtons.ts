import { updateButtons } from './updateButtons';
import { appendCanvasToGallery } from './appendCanvasToGallery';
import { DbAccess } from './database';

const gallery = document.getElementById("gallery") as HTMLDivElement;
// const getImageBtn = document.getElementById("get_image_btn") as HTMLButtonElement;
// const tearBtn = document.getElementById("tear_btn") as HTMLButtonElement;
const deleteSelectedBtn = document.getElementById("delete_selected_btn") as HTMLButtonElement;
const selectAllBtn = document.getElementById("select_all_btn") as HTMLButtonElement;
const averageSelectedBtn = document.getElementById("average_selected_btn") as HTMLButtonElement;

export const initButtons = (store: DbAccess) => {
  selectAllBtn.addEventListener("click", function () {
    const items = gallery.children;
    const markedItems = gallery.querySelectorAll('.marked-for-action');

    const unselect = markedItems.length === items.length;

    if (items.length != 0) {
      [...items].forEach(item => {
        const checkbox = item.querySelector("input") as HTMLInputElement;
        checkbox.checked = !unselect;
        item.classList[unselect ? 'remove' : 'add']('marked-for-action');
      });
    }

    updateButtons();
  });

  deleteSelectedBtn.addEventListener("click", function () {
    const items = gallery.children;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i] as HTMLDivElement;
      if (item.classList.contains('marked-for-action')) {
        const imageTime = item.dataset.timestamp;
        if (imageTime) {
          store.delete(parseInt(imageTime, 10))
        }
        item.remove();
      }
    }

    updateButtons();
  });

  averageSelectedBtn.addEventListener("click", function() {
    const items = gallery.querySelectorAll('.marked-for-action');

    if (items.length < 2) {
      return;
    }

    const avgCanvas = document.createElement('canvas');
    const avgCtx = avgCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;

    const tmpCanvas = document.createElement('canvas');
    const tmpCtx = tmpCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;

    // Verify that image dimensions are the same
    const firstImg = items[0].querySelector("img");
    if (!firstImg) return;

    const tmpW = firstImg.width;
    const tmpH = firstImg.height;
    for (let i = 1; i < items.length; i++) {
      const img = items[i].querySelector("img");
      if (!img) return;

      if (tmpW != img.width || tmpH != img.height) {
        alert("Image dimensions should be the same to do an average");
        return;
      }
    }

    tmpCanvas.width = tmpW;
    tmpCanvas.height = tmpH;

    avgCanvas.width = tmpW;
    avgCanvas.height = tmpH;

    const sumImgData = [];
    const avgImgData = avgCtx.createImageData(avgCanvas.width, avgCanvas.height);
    let selectedItems = 0;
    // Generate average image
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].classList.contains('marked-for-action')) {
        selectedItems++;
        const item = items[i];
        const img = item.querySelector("img");
        if (!img) return;
        tmpCtx.drawImage(img,0,0);
        const tmpImgData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
        for (let j = 0; j < tmpImgData.data.length; j += 1) {
          if (!sumImgData[j]) {
            sumImgData.push(0);
          }
          sumImgData[j] += tmpImgData.data[j];
        }
      }
    }
    for (let i = 0; i < avgImgData.data.length; i += 1) {
      avgImgData.data[i] = (sumImgData[i] / selectedItems);
    }
    avgCtx.putImageData(avgImgData, 0, 0);
    appendCanvasToGallery(avgCanvas);
  });


  // tearBtn.addEventListener("click", async function () {
  //   fetch(resetPath)
  //     .then((response) => {
  //       return response.json();
  //     })
  //     .then((data) => {
  //       console.log(data);
  //       if (data.result != "ok") return;
  //       getImageBtn.click();
  //     });
  // });

  updateButtons();
}
