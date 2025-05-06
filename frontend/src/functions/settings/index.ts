import {
  LOCALSTORAGE_SORTORDER_KEY,
  LOCALSTORAGE_GIF_DIR_KEY,
  LOCALSTORAGE_FPS_KEY,
  LOCALSTORAGE_SCALE_KEY,
  LOCALSTORAGE_EXPOSURE_MODE_KEY,
  Direction,
  ExposureMode,
  SortOrder,
} from '../../consts.ts';
import { updateGallery } from '../gallery';
import { DbAccess } from '../storage/database.ts';

const settingsMenu = document.getElementById('settings') as HTMLDivElement;
const settingsBackdrop = document.getElementById('settings_backdrop') as HTMLButtonElement;
const settingsCloseBtn = document.getElementById('settings_close') as HTMLButtonElement;
const sortOrderSelect = document.getElementById('sort_order') as HTMLSelectElement;
const scaleSelect = document.getElementById('download_size') as HTMLSelectElement;
const fpsSelect = document.getElementById('download_fps') as HTMLSelectElement;
const gifDirection = document.getElementById('gif_direction') as HTMLSelectElement;
const exposureMode = document.getElementById('exposure_mode') as HTMLSelectElement;
const settingsBtn = document.getElementById('open_settings') as HTMLButtonElement;

export const getSortOrder = (): SortOrder => {
  switch (localStorage.getItem(LOCALSTORAGE_SORTORDER_KEY)) {
    case SortOrder.DESCENDING:
      return SortOrder.DESCENDING;
    case SortOrder.ASCENDING:
    default:
      return SortOrder.ASCENDING;
  }
}

const updateSettings = () => {
  sortOrderSelect.value = getSortOrder();
  scaleSelect.value = localStorage.getItem(LOCALSTORAGE_SCALE_KEY) || '1';
  fpsSelect.value = localStorage.getItem(LOCALSTORAGE_FPS_KEY) || '12';
  gifDirection.value = localStorage.getItem(LOCALSTORAGE_GIF_DIR_KEY) || Direction.FORWARD;
  exposureMode.value = localStorage.getItem(LOCALSTORAGE_EXPOSURE_MODE_KEY) || ExposureMode.PRINTED;
}

export const initSettings = (store: DbAccess) => {
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


  settingsBtn.addEventListener('click', () => {
    document.body.classList.add('fixed');
    settingsMenu.classList.add('visible');
    settingsBackdrop.classList.add('visible');
  });

  settingsBackdrop.addEventListener('click', () => {
    document.body.classList.remove('fixed');
    settingsMenu.classList.remove('visible');
    settingsBackdrop.classList.remove('visible');
  });

  settingsCloseBtn.addEventListener('click', () => {
    document.body.classList.remove('fixed');
    settingsMenu.classList.remove('visible');
    settingsBackdrop.classList.remove('visible');
  });
}
