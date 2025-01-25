import { downloadDataToImageData } from '../decoding/downloadDataToImageData.ts';
import { DbAccess, DownloadData } from '../storage/database.ts';
import { addImageDataToGallery } from './addImageDataToGallery.ts';
import { initButtons } from './buttons.ts';

export const initGallery = async (store: DbAccess) => {

  const gallery = document.getElementById("gallery") as HTMLDivElement;

  const storedImages = await store.getAll();

  const handleImageDatas = (imageDatas: ImageData[], timestamp: number,) => {
    for(const imageData of imageDatas) {
      addImageDataToGallery(imageData, timestamp);
    }
  }

  for (const dlData of storedImages) {
    const imageDatas = await downloadDataToImageData(dlData);
    if (!imageDatas.length) {
      store.delete(dlData.timestamp);
    } else {
      handleImageDatas(imageDatas, dlData.timestamp);
    }
  }

  initButtons(store);

  store.onUpdate(async (allImages: DownloadData[]) => {
    // Add new ones
    for (const dlData of allImages) {
      if (!gallery.querySelector(`[data-timestamp="${dlData.timestamp}"]`)) {
        const imageDatas = await downloadDataToImageData(dlData);
        handleImageDatas(imageDatas, dlData.timestamp);
      }
    }

    // Remove deleted
    const nodes = [...gallery.querySelectorAll('[data-timestamp]')] as HTMLDivElement[];
    for (const node of nodes) {
      const nodeTimestamp = parseInt(node.dataset.timestamp || '0', 10);
      if (!allImages.find(({ timestamp }) => timestamp === nodeTimestamp)) {
        node.remove();
      }
    }
  })
}
