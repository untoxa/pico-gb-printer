import { sendClick } from '../helpers';
import { cameraIcon, listIcon, recordIcon } from '../icons';
import { timeNow, today } from '../helpers';
import { macroStore, RemoteMacroStep } from './macroStore.ts';
import { initMacros, updateMacroList } from './macros.ts';
import { HideRemoteControl, LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY, RemoteControl } from '../../consts.ts';
import { buttonLabels, ButtonValues } from './buttonValues.ts';
import './remote.scss';

const createDom = (): { container: HTMLDivElement } => {
  const container = document.querySelector('.remote-control') as HTMLDivElement;
  container.innerHTML = `
    <div class="remote-control__wrapper">
      <button class="remote-control__drawer" title="Show/Hide Remote Controller">== Remote ==</button>
      <button title="Switch to Controller" class="remote-control__meta-button" data-action="flip">${listIcon()}</button>
      <div class="remote-control__controller">
        <div class="remote-control__dpad">
          <button title="${buttonLabels[ButtonValues.DPAD_UP]}" class="remote-control__dpad-button" data-value="${ButtonValues.DPAD_UP}"></button>
          <button title="${buttonLabels[ButtonValues.DPAD_LEFT]}" class="remote-control__dpad-button" data-value="${ButtonValues.DPAD_LEFT}"></button>
          <button title="${buttonLabels[ButtonValues.DPAD_RIGHT]}" class="remote-control__dpad-button" data-value="${ButtonValues.DPAD_RIGHT}"></button>
          <button title="${buttonLabels[ButtonValues.DPAD_DOWN]}" class="remote-control__dpad-button" data-value="${ButtonValues.DPAD_DOWN}"></button>
          <button title="Record Macro" class="remote-control__dpad-button remote-control__dpad-button--macro">${recordIcon()}</button>
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


export const initRemoteControl = async (updateSetting: (value: RemoteControl) => void) => {
  const { container } = createDom();
  const buttons = [...container.querySelectorAll('[data-value]')] as HTMLButtonElement[];
  const recordButton = container.querySelector('.remote-control__dpad-button--macro') as HTMLButtonElement;
  const switchButton = container.querySelector('.remote-control__meta-button') as HTMLButtonElement;
  let macroSteps: RemoteMacroStep[] = [];
  let macroTime: number = 0;

  const stopRecording = () => {
    recordButton.classList.remove('remote-control__dpad-button--recording');

    if (macroSteps.length) {
      const datetime = new Date();
      macroStore.addNew('', {
        title: `${today(datetime, '.')} ${timeNow(datetime, ':')}`,
        steps: macroSteps,
      });

      updateSetting(RemoteControl.MACROS);
      updateMacroList();
    }
  };

  const isRecording = () => (
    recordButton.classList.contains('remote-control__dpad-button--recording')
  );

  container.addEventListener('click', (ev) => {
    const button = ev.target as HTMLButtonElement;
    const value = button.dataset.value as (ButtonValues | undefined);

    if (value) {
      buttons.forEach((button) => { button.disabled = true; });
      sendClick(parseInt(value, 16));
      buttons.forEach((button) => { button.disabled = false; });

      // const delay = Math.round((Date.now() - macroTime) / MIN_STEP_DELAY) * MIN_STEP_DELAY;
      const delay = Date.now() - macroTime;
      if (isRecording()) {
        macroSteps.push({
          comment: '', // buttonLabels[value],
          delay,
          key: value,
        });

        macroTime = Date.now();
      }
    } else if (button.classList.contains('remote-control__dpad-button--macro')) {
        if (isRecording()) {
          stopRecording();
        } else {
          button.classList.add('remote-control__dpad-button--recording');
          macroSteps = [];
          macroTime = Date.now();
      }
    }
  });

  switchButton.addEventListener('click', () => {
    if (isRecording()) {
      stopRecording();
    } else {
      updateSetting(RemoteControl.MACROS);
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

  initMacros(updateSetting);
}
