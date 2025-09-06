import {
  LOCALSTORAGE_SORTORDER_KEY,
  LOCALSTORAGE_GIF_DIR_KEY,
  LOCALSTORAGE_FPS_KEY,
  LOCALSTORAGE_SCALE_KEY,
  LOCALSTORAGE_EXPOSURE_MODE_KEY,
  Direction,
  ExposureMode,
  SortOrder, LOCALSTORAGE_REMOTE_CONTROL_KEY, RemoteControl,
} from '../../consts.ts';
import { updateGallery } from '../gallery';
import { DbAccess } from '../storage/database.ts';
import './settings.scss';

const createDom = (): { container: HTMLDivElement, backdrop: HTMLButtonElement } => {
  const container = document.querySelector('.settings') as HTMLDivElement;

  container.innerHTML = `
<div class="box">
  <button id="settings_close"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg></button>
</div>
<div class="settings-options">
  <div class="select">
    <label for="sort_order">Sort Order</label>
    <div class="box">
      <select id="sort_order" class="setting-select">
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </div>
  </div>
  <div class="select">
    <label for="download_size">Download size</label>
    <div class="box">
      <select id="download_size" class="setting-select">
        <option value="1">Scale: 1x</option>
        <option value="2">Scale: 2x</option>
        <option value="4">Scale: 4x</option>
        <option value="8">Scale: 8x</option>
      </select>
    </div>
  </div>
  <div class="select">
    <label for="download_fps">Animation speed</label>
    <div class="box">
      <select id="download_fps" class="setting-select">
        <option value="1">1 fps</option>
        <option value="2">2 fps</option>
        <option value="4">4 fps</option>
        <option value="8">8 fps</option>
        <option value="12">12 fps</option>
        <option value="18">18 fps</option>
        <option value="24">24 fps</option>
      </select>
    </div>
  </div>
  <div class="select">
    <label for="gif_direction">Animation direction</label>
    <div class="box">
      <select id="gif_direction" class="setting-select">
        <option value="fwd">Forward</option>
        <option value="rev">Reverse</option>
        <option value="yoyo">YoYo</option>
      </select>
    </div>
  </div>
  <div class="select">
    <label for="exposure_mode">Exposure mode</label>
    <div class="box">
      <select id="exposure_mode" class="setting-select">
        <option value="light">Light</option>
        <option value="medium">Medium</option>
        <option value="dark">Dark</option>
        <option value="black">Black</option>
        <option value="printed">As printed</option>
      </select>
    </div>
  </div>
  <div class="select">
    <label for="remote_control">Remote Control</label>
    <div class="box">
      <select id="remote_control" class="setting-select">
        <option value="none">No Remote</option>
        <option value="controller">Full Controller</option>
        <option value="shutter">Only Shutter</option>
        <!-- <option value="macros">Macros</option> -->
      </select>
    </div>
  </div>
</div>
<a href="https://github.com/untoxa/pico-gb-printer/" class="about-link" target="_blank">this project on GitHub</a>
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

export const initSettings = (store: DbAccess) => {
  const { container, backdrop } = createDom();

  const settingsCloseBtn = container.querySelector('#settings_close') as HTMLButtonElement;
  const sortOrderSelect = container.querySelector('#sort_order') as HTMLSelectElement;
  const scaleSelect = container.querySelector('#download_size') as HTMLSelectElement;
  const fpsSelect = container.querySelector('#download_fps') as HTMLSelectElement;
  const gifDirection = container.querySelector('#gif_direction') as HTMLSelectElement;
  const exposureMode = container.querySelector('#exposure_mode') as HTMLSelectElement;
  const remoteControl = container.querySelector('#remote_control') as HTMLSelectElement;
  const settingsBtn = document.querySelector('#open_settings') as HTMLButtonElement;

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
    backdrop.classList.add('visible');
  });

  backdrop.addEventListener('click', () => {
    document.body.classList.remove('fixed');
    container.classList.remove('visible');
    backdrop.classList.remove('visible');
  });

  settingsCloseBtn.addEventListener('click', () => {
    document.body.classList.remove('fixed');
    container.classList.remove('visible');
    backdrop.classList.remove('visible');
  });
}
