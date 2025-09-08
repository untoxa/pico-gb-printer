import { DataType, type DbAccess, DownloadData, DownloadDataRaw } from '../storage/database.ts';
import { Direction, LOCALSTORAGE_FPS_KEY, LOCALSTORAGE_GIF_DIR_KEY, LOCALSTORAGE_LIVE_VIEW_KEY } from '../../consts.ts';
import { downloadDataToImageData } from '../decoding/downloadDataToImageData.ts';
import { imageDatasToBlob } from '../canvas/imageDatasToBlob.ts';
import { cameraIcon, closeIcon, recordIcon, stopIcon } from '../icons';
import './liveview.scss';

const createDom = (): { container: HTMLDivElement, backdrop: HTMLButtonElement } => {
  const container = document.querySelector('.live-view') as HTMLDivElement;

  container.innerHTML = `
<button class="live-view__close">${closeIcon()}</button>
<div class="live-view__buttons">
  <button title="Record" class="live-view__button live-view__button--record" disabled>
    <span class="record record-icon">${recordIcon()}</span>
    <span class="pause">${stopIcon()}</span>
    <span class="record">Record</span>
    <span class="pause">Save <span class="framecount"></span></span>
  </button>
  <button title="Capture" class="live-view__button live-view__button--capture" disabled><span>${cameraIcon()}</span><span>Capture</span></button>
</div>
`;

  const backdrop = document.createElement('button');
  backdrop.classList.add('backdrop');
  (container.parentNode as HTMLElement).insertBefore(backdrop, container.nextSibling);

  return {
    container,
    backdrop
  };
}

export const initLiveView = (store: DbAccess): DbAccess => {
  const { container, backdrop } = createDom();

  const liveViewButton = document.querySelector('#live_view_btn') as HTMLButtonElement;
  const liveViewCloseButton = container.querySelector('.live-view__close') as HTMLButtonElement;
  const liveViewCaptureButton = container.querySelector('.live-view__button--capture') as HTMLButtonElement;
  const liveViewRecordButton = container.querySelector('.live-view__button--record') as HTMLButtonElement;
  const liveViewFramecount = container.querySelector('.framecount') as HTMLSpanElement;

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

  container.insertBefore(liveViewCanvas, document.querySelector('.live-view__buttons'));

  const open = () => {
    resetCanvasContent();
    localStorage.setItem(LOCALSTORAGE_LIVE_VIEW_KEY, '1');
    container.classList.add('visible');
  };

  const close = () => {
    localStorage.setItem(LOCALSTORAGE_LIVE_VIEW_KEY, '0');
    container.classList.remove('visible');
    currentLiveViewData = null;
    liveViewCaptureButton.disabled = true;
    liveViewRecordButton.disabled = true;
  };

  const capture = () => {
    if (currentLiveViewData) {
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
  backdrop.addEventListener('click', close);
  liveViewCaptureButton.addEventListener('click', capture);
  liveViewRecordButton.addEventListener('click', record);

  const wrappedStore: DbAccess = {
    ...store,
    add: async (dlData: DownloadData): Promise<void> => {
      if (!container.classList.contains('visible')) {
        return store.add(dlData);
      } else {
        await liveViewData(dlData)
      }
    },
  }

  return wrappedStore;
}
