import { ofetch } from 'ofetch';
import { HideRemoteControl, LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY } from "../../consts.ts";
import './remote.scss';

const createDom = (): HTMLDivElement => {
  const container = document.querySelector('.remote-control') as HTMLDivElement;
  container.innerHTML = `
    <div class="remote-control__controller-wrapper">
      <button class="remote-control__drawer" title="Show/Hide Remote Controller">== Remote ==</button>
      <div class="remote-control__controller">
        <div class="remote-control__dpad">
          <button title="Up" class="remote-control__dpad-button" data-value="0x04"></button>
          <button title="Left" class="remote-control__dpad-button" data-value="0x02"></button>
          <button title="Right" class="remote-control__dpad-button" data-value="0x01"></button>
          <button title="Down" class="remote-control__dpad-button" data-value="0x08"></button>
        </div>
        <div class="remote-control__ssab">
          <button title="Select" class="remote-control__ssab-button" data-value="0x40">Select</button>
          <button title="Start" class="remote-control__ssab-button" data-value="0x80">Start</button>
          <button title="B" class="remote-control__ssab-button" data-value="0x20">B</button>
          <button title="A" class="remote-control__ssab-button" data-value="0x10">A</button>
        </div>
      </div>
    </div>
    <div class="remote-control__shutter-wrapper">
      <button title="Shutter" class="remote-control__shutter-button" data-value="0x10">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Zm0-80h640v-480H638l-73-80H395l-73 80H160v480Zm320-240Z"/></svg>
      </button>
    </div>
`;
  return container;
}


export const initRemoteControl = async () => {
  const container = createDom();
  const buttons = [...container.querySelectorAll('[data-value]')] as HTMLButtonElement[];

  const sendClick = async (value: number) => {
    console.log(value);
    buttons.forEach((button) => { button.disabled = true; });
    try {
      const response = await ofetch(`/click?btn=${value.toString(10)}`, { timeout: 250 });
      if (response.result !== 'ok') { console.error(response); }
    } catch {
      console.error('timed out');
    }
    buttons.forEach((button) => { button.disabled = false; });
  }

  container.addEventListener('click', (ev) => {
    const button = ev.target as HTMLButtonElement;
    const value = button.dataset.value || '0x00';
    sendClick(parseInt(value, 16));
    console.log({ button, value });
  });

  document.body.dataset.hideremote = localStorage.getItem(LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY) || HideRemoteControl.TRUE;

  const drawerButton = container.querySelector('.remote-control__drawer') as HTMLButtonElement;
  drawerButton.addEventListener('click', () => {
    if (document.body.dataset.hideremote === HideRemoteControl.TRUE) {
      document.body.dataset.hideremote = HideRemoteControl.FALSE;
    } else {
      document.body.dataset.hideremote = HideRemoteControl.TRUE;
    }
    localStorage.setItem(LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY, document.body.dataset.hideremote)
  });
}
