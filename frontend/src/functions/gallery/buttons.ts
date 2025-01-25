import { DataType, DbAccess } from '../storage/database.ts';

const gallery = document.getElementById("gallery") as HTMLDivElement;
const deleteSelectedBtn = document.getElementById("delete_selected_btn") as HTMLButtonElement;
const selectAllBtn = document.getElementById("select_all_btn") as HTMLButtonElement;
const averageSelectedBtn = document.getElementById("average_selected_btn") as HTMLButtonElement;

export const updateButtons = () => {
  const numSelectedItems = document.querySelectorAll('.marked-for-action').length;
  selectAllBtn.disabled = !gallery.children.length;
  deleteSelectedBtn.disabled = !numSelectedItems;
  averageSelectedBtn.disabled = numSelectedItems < 2;
}


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

  averageSelectedBtn.addEventListener("click", function() {
    const items = [...gallery.querySelectorAll('.marked-for-action')] as HTMLLabelElement[];

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

    // Generate average image
    for (const item of items) {
      item.classList.remove('marked-for-action');
      const img = item.querySelector('img') as HTMLImageElement;
      tmpCtx.drawImage(img,0,0);
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
  });

  updateButtons();
}
