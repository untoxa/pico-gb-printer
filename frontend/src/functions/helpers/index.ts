import { ofetch } from 'ofetch';

export const today = (date: Date, delim: string): string  => {
  return ((date.getDate() < 10) ? '0': '') + date.getDate() + delim + (((date.getMonth()+1) < 10) ? '0' : '') + (date.getMonth()+1) + delim + date.getFullYear();
};

export const timeNow = (date: Date, delim: string): string  => {
  return ((date.getHours() < 10) ? '0' : '') + date.getHours() + delim + ((date.getMinutes() < 10) ? '0' : '') + date.getMinutes() + delim + ((date.getSeconds() < 10) ? '0' : '') + date.getSeconds();
};

export const sendClick = async (value: number) => {
  try {
    const response = await ofetch(`/click?btn=${value.toString(10)}`, { timeout: 250 });
    if (response.result !== 'ok') { console.error(response); }
  } catch {
    console.error('timed out');
  }
}
