export interface DownloadData {
  timestamp: number,
  data: Uint8Array,
}

export interface DbAccess {
  add: (dlData: DownloadData) => Promise<void>,
  delete: (timestamp: number) => Promise<void>,
  getAll: () => Promise<DownloadData[]>
}

export const initDb = async (): Promise<DbAccess> => {
  const dbName = "pico_printer";

  return new Promise((resolve) => {
    const request = indexedDB.open(dbName, 2);

    request.onerror = (event) => {
      console.error(event);
    };

    request.onsuccess = () => {
      resolve({
        add: async (dlData: DownloadData) => {
          return new Promise((resolve) => {
            const objectStore = request.result.transaction('downloads', 'readwrite').objectStore('downloads')
            const rq = objectStore.add({
              timestamp: dlData.timestamp,
              data: dlData.data.join(',')
            });

            rq.onsuccess = () => resolve()
          })
        },
        getAll: async () => {
          return new Promise((resolve) => {
            const objectStore = request.result.transaction('downloads').objectStore('downloads')
            const rq = objectStore.getAll()

            rq.onsuccess = (ev) => {
              // @ts-ignore
              const stored = ev.target?.result.map(({ timestamp, data }): DownloadData => ({
                timestamp,
                data: new Uint8Array(data.split(',').map((i: string) => parseInt(i, 10))),
              }));
              resolve(stored);
            };
          })
        },
        delete: async (timestamp: number) => {
          return new Promise((resolve) => {
            const objectStore = request.result.transaction('downloads', 'readwrite').objectStore('downloads')
            const rq = objectStore.delete(timestamp)

            rq.onsuccess = () => resolve()
          })
        }
      });
    }

    request.onupgradeneeded = () => {
      console.log('onupgradeneeded');
      const objectStore = request.result.createObjectStore("downloads", { keyPath: "timestamp" });
      objectStore.createIndex("timestamp", "timestamp", { unique: false });
    };
  })
}
