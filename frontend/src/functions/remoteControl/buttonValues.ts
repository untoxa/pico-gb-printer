export enum ButtonValues {
  NONE = '0x00',
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
  [ButtonValues.NONE]: 'None',
  [ButtonValues.DPAD_RIGHT]: 'Right',
  [ButtonValues.DPAD_LEFT]: 'Left',
  [ButtonValues.DPAD_UP]: 'Up',
  [ButtonValues.DPAD_DOWN]: 'Down',
  [ButtonValues.A]: 'A',
  [ButtonValues.B]: 'B',
  [ButtonValues.SELECT]: 'Select',
  [ButtonValues.START]: 'Start',
}

/*

0 up this should go up
1000 a this should press a
100 start and this is startbutton

*/

export function getButtonValue(text: string): ButtonValues {
  const normalized = text.toLowerCase();

  for (const [value, label] of Object.entries(buttonLabels)) {
    if (label.toLowerCase() === normalized) {
      return value as ButtonValues;
    }
  }

  return ButtonValues.NONE;
}
