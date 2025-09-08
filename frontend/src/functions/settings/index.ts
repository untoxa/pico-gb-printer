import {
  LOCALSTORAGE_SORTORDER_KEY,
  LOCALSTORAGE_GIF_DIR_KEY,
  LOCALSTORAGE_FPS_KEY,
  LOCALSTORAGE_SCALE_KEY,
  LOCALSTORAGE_EXPOSURE_MODE_KEY,
  LOCALSTORAGE_REMOTE_CONTROL_KEY,
  Direction,
  ExposureMode,
  SortOrder,
  RemoteControl,
} from '../../consts.ts';
import { closeIcon, settingsIcon } from '../icons';
import { updateGallery } from '../gallery';
import { DbAccess } from '../storage/database.ts';
import { select } from './select.ts';
import './settings.scss';

export interface Settings {
  updateRemoteControlSetting: (value: RemoteControl) => void;
}

const createDom = (): { container: HTMLDivElement, backdrop: HTMLButtonElement } => {
  const container = document.querySelector('.settings') as HTMLDivElement;

  container.innerHTML = `
<div class="box">
  <button class="settings__close">${closeIcon()}</button>
</div>
<div class="settings__options">
  ${select({
    fieldId: 'sort_order',
    label: 'Sort Order',
    options: [
      { value: SortOrder.ASCENDING, label: 'Ascending'},
      { value: SortOrder.DESCENDING, label: 'Descending'},
    ],
  })}
  
  ${select({
    fieldId: 'download_size',
    label: 'Download size',
    options: [
      { value: '1', label: 'Scale: 1x' },
      { value: '2', label: 'Scale: 2x' },
      { value: '4', label: 'Scale: 4x' },
      { value: '8', label: 'Scale: 8x' },
    ],
  })}

  ${select({
    fieldId: 'download_fps',
    label: 'Animation speed',
    options: [
      { value: '1', label: '1 fps' },
      { value: '2', label: '2 fps' },
      { value: '4', label: '4 fps' },
      { value: '8', label: '8 fps' },
      { value: '12', label: '12 fps' },
      { value: '18', label: '18 fps' },
      { value: '24', label: '24 fps' },
    ],
  })}

  ${select({
    fieldId: 'gif_direction',
    label: 'Animation direction',
    options: [
      { value: Direction.FORWARD, label: 'Forward' },
      { value: Direction.REVERSE, label: 'Reverse' },
      { value: Direction.YOYO, label: 'YoYo' },
    ],
  })}

  ${select({
    fieldId: 'exposure_mode',
    label: 'Exposure mode',
    options: [
      { value: ExposureMode.LIGHT, label: 'Light' },
      { value: ExposureMode.MEDIUM, label: 'Medium' },
      { value: ExposureMode.DARK, label: 'Dark' },
      { value: ExposureMode.BLACK, label: 'Black' },
      { value: ExposureMode.PRINTED, label: 'As printed' },
    ],
  })}

  ${select({
    fieldId: 'remote_control',
    label: 'Remote Control',
    options: [
      { value: RemoteControl.NONE, label: 'No Remote' },
      { value: RemoteControl.CONTROLLER, label: 'Full Controller' },
      { value: RemoteControl.SHUTTER, label: 'Only Shutter' },
      { value: RemoteControl.MACROS, label: 'Macros' },
    ],
  })}
</div>
<a href="https://github.com/untoxa/pico-gb-printer/" class="settings__about-link" target="_blank">this project on GitHub</a>
`;

  const backdrop = document.createElement('button');
  backdrop.classList.add('backdrop');
  (container.parentNode as HTMLElement).insertBefore(backdrop, container.nextSibling);

  return {
    container,
    backdrop
  };
}

export const getSortOrder = (): SortOrder => {
  switch (localStorage.getItem(LOCALSTORAGE_SORTORDER_KEY)) {
    case SortOrder.DESCENDING:
      return SortOrder.DESCENDING;
    case SortOrder.ASCENDING:
    default:
      return SortOrder.ASCENDING;
  }
}

export const initSettings = (store: DbAccess): Settings => {
  const { container, backdrop } = createDom();

  const sortOrderSelect = container.querySelector('#sort_order') as HTMLSelectElement;
  const scaleSelect = container.querySelector('#download_size') as HTMLSelectElement;
  const fpsSelect = container.querySelector('#download_fps') as HTMLSelectElement;
  const gifDirection = container.querySelector('#gif_direction') as HTMLSelectElement;
  const exposureMode = container.querySelector('#exposure_mode') as HTMLSelectElement;
  const remoteControl = container.querySelector('#remote_control') as HTMLSelectElement;

  const settingsBtn = document.querySelector('#open_settings') as HTMLButtonElement;
  const settingsCloseBtn = container.querySelector('.settings__close') as HTMLButtonElement;

  (settingsBtn.querySelector('.icon') as HTMLSpanElement).innerHTML = settingsIcon();

  const updateSettings = () => {
    sortOrderSelect.value = getSortOrder();
    scaleSelect.value = localStorage.getItem(LOCALSTORAGE_SCALE_KEY) || '1';
    fpsSelect.value = localStorage.getItem(LOCALSTORAGE_FPS_KEY) || '12';
    gifDirection.value = localStorage.getItem(LOCALSTORAGE_GIF_DIR_KEY) || Direction.FORWARD;
    exposureMode.value = localStorage.getItem(LOCALSTORAGE_EXPOSURE_MODE_KEY) || ExposureMode.PRINTED;
    remoteControl.value = localStorage.getItem(LOCALSTORAGE_REMOTE_CONTROL_KEY) || RemoteControl.CONTROLLER;

    document.body.dataset.remote = remoteControl.value;
  }

  updateSettings();

  sortOrderSelect.addEventListener('change', async () => {
    const sortOrder: SortOrder = sortOrderSelect.value as SortOrder || SortOrder.ASCENDING;
    localStorage.setItem(LOCALSTORAGE_SORTORDER_KEY, sortOrder);

    const items = await store.getAll();
    updateGallery(items, store, true);
  });

  scaleSelect.addEventListener('change', () => {
    const scale = parseInt(scaleSelect.value || '0', 10) || 1;
    localStorage.setItem(LOCALSTORAGE_SCALE_KEY, scale.toString(10));
  });

  fpsSelect.addEventListener('change', () => {
    const fps = parseInt(fpsSelect.value || '0', 10) || 12;
    localStorage.setItem(LOCALSTORAGE_FPS_KEY, fps.toString(10));
  });

  gifDirection.addEventListener('change', () => {
    const dir = gifDirection.value || Direction.FORWARD;
    localStorage.setItem(LOCALSTORAGE_GIF_DIR_KEY, dir);
  });

  exposureMode.addEventListener('change', async () => {
    const mode = exposureMode.value || ExposureMode.PRINTED;
    localStorage.setItem(LOCALSTORAGE_EXPOSURE_MODE_KEY, mode);

    const items = await store.getAll();
    updateGallery(items, store, true);
  });

  remoteControl.addEventListener('change', () => {
    const rc = remoteControl.value || RemoteControl.CONTROLLER;
    document.body.dataset.remote = rc;
    localStorage.setItem(LOCALSTORAGE_REMOTE_CONTROL_KEY, rc);
  });

  settingsBtn.addEventListener('click', () => {
    document.body.classList.add('fixed');
    container.classList.add('visible');
  });

  const close = () => {
    document.body.classList.remove('fixed');
    container.classList.remove('visible');
  };

  backdrop.addEventListener('click', close);
  settingsCloseBtn.addEventListener('click', close);

  const updateRemoteControlSetting = (value: RemoteControl) => {
    remoteControl.value = value;
    document.body.dataset.remote = value;
    localStorage.setItem(LOCALSTORAGE_REMOTE_CONTROL_KEY, value);
  }

  return {
    updateRemoteControlSetting,
  }
}
