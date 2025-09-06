import { ofetch } from 'ofetch';
import { BASIC_POLL_DELAY, DOWNLOAD, MAX_POLL_DELAY, STATUS_FILE } from '../consts';
import { DataType, DbAccess, DownloadDataRaw } from './storage/database.ts';

export interface StatusResponse {
  options: {
    debug: 'on' | 'off'
  },
  result: string,
  status: {
    last_size: number,
    total_files: number,
  },
  system: {
    fast: boolean,
  },
}

export const startPolling = async (store: DbAccess) => {
  const indicator = document.querySelector('.indicator') as HTMLSpanElement;
  let pollDelay = BASIC_POLL_DELAY;

  const pollDownload = async () => {
    try {
      const status = await ofetch<StatusResponse>(STATUS_FILE, { method: 'GET', timeout: 1000 });
      indicator.classList.remove('red');
      indicator.classList.add('green');
      indicator.title = 'Device is connected';

      if (status.status.total_files > 0) {
        const downloadResponse = await ofetch.raw(DOWNLOAD, {
          method: 'GET',
          timeout: 1000,
          responseType: 'arrayBuffer',
          ignoreResponseError: true,
        });

        if (downloadResponse.status === 200 && downloadResponse._data?.byteLength) {
          const dlData: DownloadDataRaw = {
            timestamp: Date.now(),
            type: DataType.RAW,
            data: new Uint8Array(downloadResponse._data),
          };

          await store.add(dlData);

          pollDelay = BASIC_POLL_DELAY;
        } else { // 404 case
          pollDelay = Math.min(MAX_POLL_DELAY, Math.ceil(pollDelay * 1.5));
        }
      } else {
        pollDelay = Math.min(MAX_POLL_DELAY, Math.ceil(pollDelay * 1.5));
      }
    } catch { // network error case
      pollDelay = Math.min(MAX_POLL_DELAY, Math.ceil(pollDelay * 5));
      indicator.classList.add('red');
      indicator.classList.remove('green');
      indicator.title = 'Device is disconnected';
    }

    window.setTimeout(pollDownload, pollDelay);
  };

  pollDownload();
}
