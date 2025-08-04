import {DataType, type DbAccess, DownloadData, DownloadDataRaw} from '../storage/database.ts';
import {LOCALSTORAGE_LIVE_VIEW_KEY} from '../../consts.ts';
import {downloadDataToImageData} from '../decoding/downloadDataToImageData.ts';

const liveViewButton = document.getElementById('live_view_btn') as HTMLButtonElement;
const liveViewCloseButton = document.getElementById('live_view_close') as HTMLButtonElement;
const liveViewCaptureButton = document.getElementById('live_view_capture') as HTMLButtonElement;
const liveViewBackdrop = document.getElementById('live_view_backdrop') as HTMLDivElement;
const liveView = document.getElementById('live_view') as HTMLDivElement;


export const initLiveView = (store: DbAccess): DbAccess => {
  let currentLiveViewData: DownloadData | null = null;
  const liveViewCanvas = document.createElement('canvas');
  const liveViewContext = liveViewCanvas.getContext('2d') as CanvasRenderingContext2D;
  // let liveVewTimer = 0;

  const resetCanvasContent = () => {
    liveViewCanvas.width = 128;
    liveViewCanvas.height = 112;
    liveViewCanvas.style.width = '256px';
    liveViewCanvas.style.height = '224px';
    liveViewContext.fillStyle = '#ddd';
    liveViewContext.fillRect(0, 0, 128, 112);
    liveViewContext.font = '14px Arial'
    liveViewContext.textAlign = 'center';
    liveViewContext.textBaseline = 'middle';
    liveViewContext.fillStyle = '#222';
    liveViewContext.fillText('Waiting for image', 64, 56);
  }

  liveView.insertBefore(liveViewCanvas, liveViewCaptureButton);

  const open = () => {
    resetCanvasContent();
    localStorage.setItem(LOCALSTORAGE_LIVE_VIEW_KEY, '1');
    liveViewBackdrop.classList.add('visible');
  };

  const close = () => {
    localStorage.setItem(LOCALSTORAGE_LIVE_VIEW_KEY, '0');
    liveViewBackdrop.classList.remove('visible');
    currentLiveViewData = null;
    liveViewCaptureButton.disabled = true;
  };

  const capture = () => {
    if (currentLiveViewData) {
      console.log(currentLiveViewData);
      store.add(currentLiveViewData);
      currentLiveViewData = null;
      liveViewCaptureButton.disabled = true;
    }
  };

  const liveViewData = async (dlData: DownloadData) => {
    currentLiveViewData = dlData;
    liveViewCaptureButton.disabled = false;
    if (dlData.type !== DataType.RAW) {
      return;
    }

    const data = dlData as DownloadDataRaw;
    const [imageData] = await downloadDataToImageData(data);

    if (imageData) {
      liveViewCanvas.width = imageData.width;
      liveViewCanvas.height = imageData.height;
      liveViewCanvas.style.width = `${imageData.width * 2}px`;
      liveViewCanvas.style.height = `${imageData.height * 2}px`;
      liveViewContext.putImageData(imageData, 0, 0);
    }

    // window.clearTimeout(liveVewTimer);
    // liveVewTimer = window.setTimeout(resetCanvasContent, 15000);
  }

  if (localStorage.getItem(LOCALSTORAGE_LIVE_VIEW_KEY) === '1') {
    open();
  } else {
    close();
  }

  liveViewButton.addEventListener('click', open);
  liveViewCloseButton.addEventListener('click', close);
  liveViewBackdrop.addEventListener('click', close);
  liveViewCaptureButton.addEventListener('click', capture);

  const wrappedStore: DbAccess = {
    ...store,
    add: async (dlData: DownloadData): Promise<void> => {
      if (!liveViewBackdrop.classList.contains('visible')) {
        return store.add(dlData);
      } else {
        await liveViewData(dlData)
      }
    },
  }

  return wrappedStore;
}
