import { DbAccess } from '../storage/database.ts';
import checkPrinter from './checkPrinter';
import { CheckPrinterStatus } from './types';

const clearPrinter = (store: DbAccess) => async (): Promise<CheckPrinterStatus> => {
  const allDumps = await store.getAll();

  for (const { timestamp } of allDumps) {
    await store.delete(timestamp);
  }

  return checkPrinter(store)()
};

export default clearPrinter;
