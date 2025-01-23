import { DbAccess } from '../storage/database.ts';
import { CheckPrinterStatus } from './types';

const checkPrinter = (store: DbAccess) => async (): Promise<CheckPrinterStatus> => {

  const allImages = await store.getAll();

  return {
    printerData: {
      dumps: allImages.map(({ timestamp }) => timestamp.toString(10)),
    },
  };
};

export default checkPrinter;
