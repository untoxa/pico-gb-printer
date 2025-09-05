import { ofetch } from 'ofetch';
import { HideRemoteControl, LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY } from "../../consts.ts";
const buttonDup = document.getElementById('dup') as HTMLButtonElement;
const buttonDleft = document.getElementById('dleft') as HTMLButtonElement;
const buttonDright = document.getElementById('dright') as HTMLButtonElement;
const buttonDdown = document.getElementById('ddown') as HTMLButtonElement;
const buttonDcenter = document.getElementById('dcenter') as HTMLButtonElement;
const buttonSelect = document.getElementById('select') as HTMLButtonElement;
const buttonStart = document.getElementById('start') as HTMLButtonElement;
const buttonBtnb = document.getElementById('btnb') as HTMLButtonElement;
const buttonBtna = document.getElementById('btna') as HTMLButtonElement;
const buttonDrawer = document.getElementById('remote-drawer') as HTMLButtonElement;
const buttonSingleShutter = document.getElementById('btnshutter') as HTMLButtonElement;

const buttons = [
  buttonDup,
  buttonDleft,
  buttonDright,
  buttonDdown,
  buttonDcenter,
  buttonSelect,
  buttonStart,
  buttonBtnb,
  buttonBtna,
]

const sendClick = async (value: number) => {
  buttons.forEach((button) => { button.disabled = true; });
  try {
    const response = await ofetch(`/click?btn=${value.toString(10)}`, { timeout: 250 });
    if (response.result !== 'ok') { console.error(response); }
  } catch {
    console.error('timed out');
  }
  buttons.forEach((button) => { button.disabled = false; });
}

export const initRemoteControl = async () => {
  buttonDup.addEventListener('click', () => { sendClick(0x04); });
  buttonDleft.addEventListener('click', () => { sendClick(0x02); });
  buttonDright.addEventListener('click', () => { sendClick(0x01); });
  buttonDdown.addEventListener('click', () => { sendClick(0x08); });
  buttonSelect.addEventListener('click', () => { sendClick(0x40); });
  buttonStart.addEventListener('click', () => { sendClick(0x80); });
  buttonBtnb.addEventListener('click', () => { sendClick(0x20); });
  buttonBtna.addEventListener('click', () => { sendClick(0x10); });
  buttonSingleShutter.addEventListener('click', () => { sendClick(0x10); });

  document.body.dataset.hideremote = localStorage.getItem(LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY) || HideRemoteControl.FALSE;

  buttonDrawer.addEventListener('click', () => {
    if (document.body.dataset.hideremote === HideRemoteControl.TRUE) {
      document.body.dataset.hideremote = HideRemoteControl.FALSE;
    } else {
      document.body.dataset.hideremote = HideRemoteControl.TRUE;
    }
    localStorage.setItem(LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY, document.body.dataset.hideremote)
  });
}
