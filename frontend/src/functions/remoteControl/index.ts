import { ofetch } from 'ofetch';
import { HideRemoteControl, LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY } from '../../consts.ts';
import { cameraIcon } from '../icons';
import './remote.scss';

const createDom = (): { container: HTMLDivElement } => {
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
        ${cameraIcon()}
      </button>
    </div>
`;
  return { container };
}


export const initRemoteControl = async () => {
  const { container } = createDom();
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
    const value = button.dataset.value;

    if (value) {
      sendClick(parseInt(value, 16));
    }
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
