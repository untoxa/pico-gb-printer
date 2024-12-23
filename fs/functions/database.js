export const initDb = async () => {
    const dbName = "pico_printer";
    return new Promise((resolve) => {
        const request = indexedDB.open(dbName, 2);
        request.onerror = (event) => {
            console.error(event);
        };
        request.onsuccess = () => {
            resolve({
                add: async (dlData) => {
                    return new Promise((resolve) => {
                        const objectStore = request.result.transaction('downloads', 'readwrite').objectStore('downloads');
                        const rq = objectStore.add({
                            timestamp: dlData.timestamp,
                            data: dlData.data.join(',')
                        });
                        rq.onsuccess = () => resolve();
                    });
                },
                getAll: async () => {
                    return new Promise((resolve) => {
                        const objectStore = request.result.transaction('downloads').objectStore('downloads');
                        const rq = objectStore.getAll();
                        rq.onsuccess = (ev) => {
                            // @ts-ignore
                            const stored = ev.target?.result.map(({ timestamp, data }) => ({
                                timestamp,
                                data: new Uint8Array(data.split(',').map((i) => parseInt(i, 10))),
                            }));
                            resolve(stored);
                        };
                    });
                },
                delete: async (timestamp) => {
                    return new Promise((resolve) => {
                        const objectStore = request.result.transaction('downloads', 'readwrite').objectStore('downloads');
                        const rq = objectStore.delete(timestamp);
                        rq.onsuccess = () => resolve();
                    });
                }
            });
        };
        request.onupgradeneeded = () => {
            console.log('onupgradeneeded');
            const objectStore = request.result.createObjectStore("downloads", { keyPath: "timestamp" });
            objectStore.createIndex("timestamp", "timestamp", { unique: false });
        };
    });
};
