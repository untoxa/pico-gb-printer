import { downloadDataToImageData } from '../decoding/downloadDataToImageData.ts';
import {
  DataType,
  DbAccess,
  DownloadData,
  DownloadDataFile,
  DownloadDataImageData,
  DownloadDataRaw,
} from '../storage/database.ts';
import { addFileToGallery, addImageDataToGallery } from './addImageDataToGallery.ts';
import { initButtons } from './buttons.ts';

export const initGallery = async (store: DbAccess) => {

  const gallery = document.getElementById("gallery") as HTMLDivElement;

  const storedImages = (await store.getAll())
    ;

  const handleImageDatas = async (imageDatas: ImageData[], timestamp: number,) => {
    for(const imageData of imageDatas) {
      await addImageDataToGallery(imageData, timestamp);
    }
  }

  const handleDownloadData = async (dlData: DownloadData) => {
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

      case DataType.FILE: {
        const data = dlData as DownloadDataFile;
        await addFileToGallery(data.data, dlData.timestamp)
      }
    }
  }

  for (const dlData of storedImages) {
    await handleDownloadData(dlData);
  }

  initButtons(store);

  store.onUpdate(async (allImages: DownloadData[]) => {
    // Add new ones
    for (const dlData of allImages) {
      if (!gallery.querySelector(`[data-timestamp="${dlData.timestamp}"]`)) {
        await handleDownloadData(dlData);
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
