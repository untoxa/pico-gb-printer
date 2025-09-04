// Api URLs
export const DOWNLOAD = "/download";
export const STATUS_FILE = "/status.json"

// Printer Commands
export const COMMAND_INIT      = 0x01;
export const COMMAND_PRINT     = 0x02;
export const COMMAND_DATA      = 0x04;
export const COMMAND_TRANSFER  = 0x10;

// Image specific
export const PRINTER_WIDTH = 20;
export const CAMERA_WIDTH  = 16;
export const TILE_SIZE     = 0x10;
export const TILE_HEIGHT   = 8;
export const TILE_WIDTH    = 8;

export const MAX_POLL_DELAY = 1500;
export const BASIC_POLL_DELAY  = 10;

export const LOCALSTORAGE_SORTORDER_KEY = 'pico-printer-sort-order';
export const LOCALSTORAGE_SCALE_KEY = 'pico-printer-save-scale';
export const LOCALSTORAGE_FPS_KEY = 'pico-printer-save-fps';
export const LOCALSTORAGE_GIF_DIR_KEY = 'pico-printer-gif-direction';
export const LOCALSTORAGE_EXPOSURE_MODE_KEY = 'pico-printer-exposure-mode';
export const LOCALSTORAGE_REMOTE_CONTROL_KEY = 'pico-printer-remote-control';
export const LOCALSTORAGE_LIVE_VIEW_KEY = 'pico-printer-live-view';

export enum SortOrder {
  ASCENDING = 'asc',
  DESCENDING = 'desc',
}

export enum Direction {
  FORWARD = 'fwd',
  REVERSE = 'rev',
  YOYO = 'yoyo',
}

export enum ExposureMode {
  LIGHT = 'light',
  MEDIUM = 'medium',
  DARK = 'dark',
  BLACK = 'black',
  PRINTED = 'printed',
}

export enum RemoteControl {
  NONE = 'none',
  CONTROLLER = 'controller',
  SHUTTER = 'shutter',
  MACROS = 'macros',
}
