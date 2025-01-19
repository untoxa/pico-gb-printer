import { DbAccess } from '../database';
import { BlobResponse, PrinterImages } from './types';


const fetchImages = (store: DbAccess) => async (dumps: string[]): Promise<PrinterImages> => {
  const allDumps = await store.getAll();
  const blobsdone: BlobResponse[] = [];

  for (const dump of dumps) {
    const dlData = allDumps.find(({ timestamp }) => timestamp.toString(10) === dump)
    if (dlData) {
      blobsdone.push({
        ok: true,
        blob: new Blob([dlData.data]),
        contentType: 'application/pico-printer-binary-log',
        status: 200,
      });
    }
  }

  return { blobsdone };
};

export default fetchImages;
