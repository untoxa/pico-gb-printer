import {DataType, type DbAccess, DownloadData, DownloadDataRaw} from '../storage/database.ts';
import { Direction, LOCALSTORAGE_FPS_KEY, LOCALSTORAGE_GIF_DIR_KEY, LOCALSTORAGE_LIVE_VIEW_KEY } from '../../consts.ts';
import { downloadDataToImageData } from '../decoding/downloadDataToImageData.ts';
import { imageDatasToBlob } from '../canvas/imageDatasToBlob.ts';
import { cameraIcon } from '../icons';

const liveViewButton = document.getElementById('live_view_btn') as HTMLButtonElement;
const liveViewCloseButton = document.getElementById('live_view_close') as HTMLButtonElement;
const liveViewCaptureButton = document.getElementById('live_view_capture') as HTMLButtonElement;
const liveViewBackdrop = document.getElementById('live_view_backdrop') as HTMLDivElement;
const liveViewRecordButton = document.getElementById('live_view_record') as HTMLButtonElement;
const liveViewFramecount = document.getElementById('live_view_framecount') as HTMLSpanElement;
const liveView = document.getElementById('live_view') as HTMLDivElement;


export const initLiveView = (store: DbAccess): DbAccess => {
  let currentLiveViewData: DownloadData | null = null;
  const liveViewCanvas = document.createElement('canvas');
  const liveViewContext = liveViewCanvas.getContext('2d') as CanvasRenderingContext2D;
  let recordFrames: ImageData[] = [];

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

  liveView.insertBefore(liveViewCanvas, document.getElementById('live_view_buttons'));

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
    liveViewRecordButton.disabled = true;
  };

  const capture = () => {
    if (currentLiveViewData) {
      console.log(currentLiveViewData);
      store.add(currentLiveViewData);
      currentLiveViewData = null;
      liveViewCaptureButton.disabled = true;
    }
  };

  const createAnimation = async () => {
    const fps = parseInt(localStorage.getItem(LOCALSTORAGE_FPS_KEY) || '12', 10);
    const dir = localStorage.getItem(LOCALSTORAGE_GIF_DIR_KEY) as Direction || Direction.FORWARD;

    if (recordFrames.length < 2) {
      return;
    }

    switch (dir) {
      case Direction.FORWARD:
        break;

      case Direction.REVERSE:
        recordFrames.reverse();
        break;

      case Direction.YOYO: {
        if (recordFrames.length > 2) {
          recordFrames.push(...recordFrames.slice(1, -1).reverse());
        }
        break;
      }

      default:
        break;
    }


    const timestamp = Date.now();
    store.add({
      type: DataType.BLOB,
      timestamp,
      data: await imageDatasToBlob(recordFrames, fps),
    });
  }


  const record = async () => {
    if (liveViewRecordButton.classList.contains('recording')) {
      liveViewRecordButton.classList.add('paused');
      liveViewRecordButton.classList.remove('recording');
      await createAnimation();
      recordFrames = [];
      liveViewFramecount.innerText = '';
    } else {
      liveViewRecordButton.classList.remove('paused');
      liveViewRecordButton.classList.add('recording');
    }
  }

  const liveViewData = async (dlData: DownloadData) => {
    currentLiveViewData = dlData;
    liveViewRecordButton.disabled = false;
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

      if (liveViewRecordButton.classList.contains('recording')) {
        recordFrames.push(imageData);
        liveViewFramecount.innerText = `(${recordFrames.length.toString(10)})`;
      }
    }
  }

  if (localStorage.getItem(LOCALSTORAGE_LIVE_VIEW_KEY) === '1') {
    open();
  } else {
    close();
  }

  liveViewButton.addEventListener('click', open);

  (liveViewButton.querySelector('.icon') as HTMLSpanElement).innerHTML = cameraIcon();

  liveViewCloseButton.addEventListener('click', close);
  liveViewBackdrop.addEventListener('click', close);
  liveViewCaptureButton.addEventListener('click', capture);
  liveViewRecordButton.addEventListener('click', record);

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
