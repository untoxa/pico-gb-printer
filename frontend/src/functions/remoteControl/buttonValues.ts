export enum ButtonValues {
  DPAD_RIGHT = '0x01',
  DPAD_LEFT = '0x02',
  DPAD_UP = '0x04',
  DPAD_DOWN = '0x08',
  A = '0x10',
  B = '0x20',
  SELECT = '0x40',
  START = '0x80',
}

export const buttonLabels: Record<ButtonValues, string> = {
  [ButtonValues.DPAD_RIGHT]: 'Right',
  [ButtonValues.DPAD_LEFT]: 'Left',
  [ButtonValues.DPAD_UP]: 'Up',
  [ButtonValues.DPAD_DOWN]: 'Down',
  [ButtonValues.A]: 'A',
  [ButtonValues.B]: 'B',
  [ButtonValues.SELECT]: 'Select',
  [ButtonValues.START]: 'Start',
}
