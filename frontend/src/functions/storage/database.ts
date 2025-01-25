export enum DataType {
  RAW = 'RAW',
  IMAGE_DATA = 'IMAGE_DATA',
}

export interface DownloadData {
  timestamp: number,
  data: Uint8Array | ImageData,
  type: DataType,
}

export interface DownloadDataRaw extends DownloadData {
  type: DataType.RAW,
  data: Uint8Array,
}

export interface DownloadDataImageData extends DownloadData {
  type: DataType.IMAGE_DATA,
  data: ImageData,
}

interface StorageData {
  timestamp: number,
  data: string,
  type: DataType,
}

export type UpdateCallbackFn = (data: DownloadData[]) => void;

export interface DbAccess {
  add: (dlData: DownloadData) => Promise<void>,
  delete: (timestamp: number) => Promise<void>,
  getAll: () => Promise<DownloadData[]>,
  onUpdate: (callback: UpdateCallbackFn) => void,
  offUpdate: (callback: UpdateCallbackFn) => void,
}

export const initDb = async (): Promise<DbAccess> => {
  const dbName = "pico_printer";

  return new Promise((resolve) => {
    const request = indexedDB.open(dbName, 3);

    let callbacks: UpdateCallbackFn[] = [];

    request.onerror = (event) => {
      console.error(event);
    };

    request.onsuccess = () => {
      const channel = new BroadcastChannel('pico_printer_db');

      const getAll = async (): Promise<DownloadData[]> => {
        return new Promise((res) => {
          const objectStore = request.result.transaction('downloads').objectStore('downloads')
          const rq = objectStore.getAll()

          rq.onsuccess = (ev) => {
            // @ts-ignore
            const stored = ev.target?.result.map(({ timestamp, data, type }: StorageData): DownloadData | null => {
              switch (type) {
                case DataType.RAW: {
                  return ({
                    timestamp,
                    type: DataType.RAW,
                    data: new Uint8Array(data.split(',').map((i: string) => parseInt(i, 10))),
                  });
                }

                case DataType.IMAGE_DATA: {
                  const rawImageData = JSON.parse(data);
                  return ({
                    timestamp,
                    type: DataType.IMAGE_DATA,
                    data: new ImageData(
                      new Uint8ClampedArray(rawImageData.data.split(',').map((i: string) => parseInt(i, 10))),
                      rawImageData.width as number,
                      rawImageData.height as number,
                    ),
                  });
                }

                default:
                  return null;
              }
            });

            res(stored.filter(Boolean));
          };
        });
      };

      const runCallbacks = async () => {
        const data: DownloadData[] = await getAll();
        for (const callback of callbacks) {
          callback(data);
        }
      }

      channel.onmessage = (event) => {
        if (event.data.type === 'UPDATE_DB') {
          runCallbacks();
        }
      };

      resolve({
        add: async (dlData: DownloadData) => {
          return new Promise((res) => {
            const objectStore = request.result.transaction('downloads', 'readwrite').objectStore('downloads')
            let storageData: StorageData;

            switch (dlData.type) {
              case DataType.RAW: {
                storageData = {
                  timestamp: dlData.timestamp,
                  type: dlData.type,
                  data: (dlData.data as Uint8Array).join(',')
                }
                break;
              }

              case DataType.IMAGE_DATA: {
                const imageData = dlData.data as ImageData;
                storageData = {
                  timestamp: dlData.timestamp,
                  type: dlData.type,
                  data: JSON.stringify({
                    data: [...imageData.data].join(','),
                    width: imageData.width,
                    height: imageData.height,
                  }),
                };
                break;
              }

              default:
                throw new Error(`unknown datatype ${dlData.type}`);
            }

            const rq = objectStore.add(storageData);
            rq.onsuccess = () => res();
            runCallbacks();
            channel.postMessage({ type: 'UPDATE_DB' });
          })
        },
        getAll,
        delete: async (timestamp: number) => {
          return new Promise((res) => {
            const objectStore = request.result.transaction('downloads', 'readwrite').objectStore('downloads')
            const rq = objectStore.delete(timestamp)

            rq.onsuccess = () => res();
            runCallbacks();
            channel.postMessage({ type: 'UPDATE_DB' });
          })
        },
        onUpdate: (cbFn: UpdateCallbackFn) => {
          callbacks.push(cbFn);
        },
        offUpdate: (cbFn: UpdateCallbackFn) => {
          callbacks = callbacks.filter((fn) => fn !== cbFn);
        },
      });
    }

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 3) {
        // Access the existing "downloads" store
        if (db.objectStoreNames.contains("downloads")) {
          const transaction = (event.target as IDBOpenDBRequest)?.transaction;
          const store = transaction?.objectStore("downloads");

          if (store) {
            // Open a cursor to iterate through all records
            store.openCursor().onsuccess = (cursorEvent: Event) => {
              const request = cursorEvent.target as IDBRequest<IDBCursorWithValue>;
              const cursor = request.result;

              if (cursor) {
                const record = cursor.value as DownloadData;

                const updatedRecord: DownloadData = {
                  ...record,
                  type: DataType.RAW,
                };

                // Update the record in the store
                store.put(updatedRecord);

                // Move to the next record
                cursor.continue();
              }
            };
          }
        } else {
          const objectStore = request.result.createObjectStore("downloads", { keyPath: "timestamp" });
          objectStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      }
    };
  })
}
