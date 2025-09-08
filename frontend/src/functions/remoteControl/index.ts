import { ofetch } from 'ofetch';
import { initMacros } from './macros.ts';
import { HideRemoteControl, LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY } from '../../consts.ts';
import { cameraIcon } from '../icons';
import { buttonLabels, ButtonValues } from './buttonValues.ts';
import './remote.scss';

const createDom = (): { container: HTMLDivElement } => {
  const container = document.querySelector('.remote-control') as HTMLDivElement;
  container.innerHTML = `
    <div class="remote-control__controller-wrapper">
      <button class="remote-control__drawer" title="Show/Hide Remote Controller">== Remote ==</button>
      <div class="remote-control__controller">
        <div class="remote-control__dpad">
          <button title="${buttonLabels[ButtonValues.DPAD_UP]}" class="remote-control__dpad-button" data-value="${ButtonValues.DPAD_UP}"></button>
          <button title="${buttonLabels[ButtonValues.DPAD_LEFT]}" class="remote-control__dpad-button" data-value="${ButtonValues.DPAD_LEFT}"></button>
          <button title="${buttonLabels[ButtonValues.DPAD_RIGHT]}" class="remote-control__dpad-button" data-value="${ButtonValues.DPAD_RIGHT}"></button>
          <button title="${buttonLabels[ButtonValues.DPAD_DOWN]}" class="remote-control__dpad-button" data-value="${ButtonValues.DPAD_DOWN}"></button>
        </div>
        <div class="remote-control__ssab">
          <button title="${buttonLabels[ButtonValues.SELECT]}" class="remote-control__ssab-button" data-value="${ButtonValues.SELECT}">${buttonLabels[ButtonValues.SELECT]}</button>
          <button title="${buttonLabels[ButtonValues.START]}" class="remote-control__ssab-button" data-value="${ButtonValues.START}">${buttonLabels[ButtonValues.START]}</button>
          <button title="${buttonLabels[ButtonValues.B]}" class="remote-control__ssab-button" data-value="${ButtonValues.B}">${buttonLabels[ButtonValues.B]}</button>
          <button title="${buttonLabels[ButtonValues.A]}" class="remote-control__ssab-button" data-value="${ButtonValues.A}">${buttonLabels[ButtonValues.A]}</button>
        </div>
      </div>
    </div>
    <div class="remote-control__shutter-wrapper">
      <button title="Shutter" class="remote-control__shutter-button" data-value="${ButtonValues.A}">
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
  drawerButton.addEventListener('mousedown', () => {
    if (document.body.dataset.hideremote === HideRemoteControl.TRUE) {
      document.body.dataset.hideremote = HideRemoteControl.FALSE;
    } else {
      document.body.dataset.hideremote = HideRemoteControl.TRUE;
    }
    localStorage.setItem(LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY, document.body.dataset.hideremote)
  });

  initMacros();
}
