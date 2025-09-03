import { ofetch } from 'ofetch';

const buttonDup = document.getElementById('dup') as HTMLButtonElement;
const buttonDleft = document.getElementById('dleft') as HTMLButtonElement;
const buttonDright = document.getElementById('dright') as HTMLButtonElement;
const buttonDdown = document.getElementById('ddown') as HTMLButtonElement;
// const buttonDcenter = document.getElementById('dcenter') as HTMLButtonElement;
const buttonSelect = document.getElementById('select') as HTMLButtonElement;
const buttonStart = document.getElementById('start') as HTMLButtonElement;
const buttonBtnb = document.getElementById('btnb') as HTMLButtonElement;
const buttonBtna = document.getElementById('btna') as HTMLButtonElement;

const sendClick = async (button: HTMLButtonElement, value: number) => {
  button.disabled = true;
  const response = await ofetch(`/click?btn=${value.toString(10)}`);
  if (response.result !== 'ok') { console.error(response); }
  button.disabled = false;
}

export const initRemoteControl = async () => {
  buttonDup.addEventListener('click', () => { sendClick(buttonDup, 0x04); })
  buttonDleft.addEventListener('click', () => { sendClick(buttonDleft, 0x02); })
  buttonDright.addEventListener('click', () => { sendClick(buttonDright, 0x01); })
  buttonDdown.addEventListener('click', () => { sendClick(buttonDdown, 0x08); })
  buttonSelect.addEventListener('click', () => { sendClick(buttonSelect, 0x40); })
  buttonStart.addEventListener('click', () => { sendClick(buttonStart, 0x80); })
  buttonBtnb.addEventListener('click', () => { sendClick(buttonBtnb, 0x20); })
  buttonBtna.addEventListener('click', () => { sendClick(buttonBtna, 0x10); })
}
