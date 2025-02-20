import { downloadDataToImageData } from '../decoding/downloadDataToImageData.ts';
import {
  DataType,
  DbAccess,
  DownloadData,
  DownloadDataBlob,
  DownloadDataImageData,
  DownloadDataRaw,
} from '../storage/database.ts';
import { addBlobToGallery, addImageDataToGallery } from './addImageDataToGallery.ts';
import { initButtons } from './buttons.ts';

const handleImageDatas = async (imageDatas: ImageData[], timestamp: number,) => {
  for(const imageData of imageDatas) {
    await addImageDataToGallery(imageData, timestamp);
  }
}

const handleDownloadData = async (dlData: DownloadData, store: DbAccess) => {
  switch (dlData.type) {
    case DataType.RAW: {
      const data = dlData as DownloadDataRaw;
      const imageDatas = await downloadDataToImageData(data);
      if (!imageDatas.length) {
        await store.delete(dlData.timestamp);
        console.log('del', dlData.timestamp);
      } else {
        await handleImageDatas(imageDatas, dlData.timestamp);
      }

      break;
    }

    case DataType.IMAGE_DATA: {
      const data = dlData as DownloadDataImageData;
      await addImageDataToGallery(data.data, dlData.timestamp);
      break;
    }

    case DataType.BLOB: {
      const data = dlData as DownloadDataBlob;
      await addBlobToGallery(data.data, dlData.timestamp)
    }
  }
}

export const updateGallery = async (allImages: DownloadData[], store: DbAccess, forceAll: boolean): Promise<void> => {
  const gallery = document.getElementById('gallery') as HTMLDivElement;

  if (forceAll) {
    gallery.innerHTML = '';
  }

  // Add new ones
  for (const dlData of allImages) {
    const existingNode = gallery.querySelector(`[data-timestamp="${dlData.timestamp}"]`);
    if (forceAll || !existingNode) {
      await handleDownloadData(dlData, store);
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
}

export const initGallery = async (store: DbAccess) => {
  const storedImages = await store.getAll();

  for (const dlData of storedImages) {
    await handleDownloadData(dlData, store);
  }

  initButtons(store);

  store.onUpdate((allImages: DownloadData[]) => updateGallery(allImages, store, false))
}
