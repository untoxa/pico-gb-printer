import { ofetch } from 'ofetch';
import {showToast} from "../toast";

export const today = (date: Date, delim: string): string  => {
  return ((date.getDate() < 10) ? '0': '') + date.getDate() + delim + (((date.getMonth()+1) < 10) ? '0' : '') + (date.getMonth()+1) + delim + date.getFullYear();
};

export const timeNow = (date: Date, delim: string): string  => {
  return ((date.getHours() < 10) ? '0' : '') + date.getHours() + delim + ((date.getMinutes() < 10) ? '0' : '') + date.getMinutes() + delim + ((date.getSeconds() < 10) ? '0' : '') + date.getSeconds();
};

export const sendClick = async (value: number) => {
  try {
    const response = await ofetch(`/click?btn=${value.toString(10)}`, { timeout: 250 });
    if (response.result !== 'ok') {
      showToast(`There was an error sending 0x${value.toString(16)}`)
    }
  } catch {
    showToast(`There was a time out while sending 0x${value.toString(16)}`)
  }
}

export const escape = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
