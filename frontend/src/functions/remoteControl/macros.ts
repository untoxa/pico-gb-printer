import { ofetch } from 'ofetch';
import { macroStore, RemoteMacro, RemoteMacroStep } from './macroStore.ts';
import { progressDone, progressStart, progressUpdate } from '../progress';
import { delay as wait } from '../delay.ts';
import { HideRemoteControl, LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY, MIN_STEP_DELAY, RemoteControl } from '../../consts.ts';
import { addIcon, deleteIcon, editIcon, flipIcon, playIcon } from '../icons';
import { buttonLabels, ButtonValues, getButtonValue } from './buttonValues.ts';
import './macros.scss';

const escape = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const createDom = (): { container: HTMLDivElement } => {
  const container = document.querySelector('.remote-control-macros') as HTMLDivElement;
  container.innerHTML = `
    <div class="remote-control-macros__wrapper">
      <button class="remote-control-macros__drawer" title="Show/Hide Macro Window">== Macros ==</button>
      <div class="remote-control-macros__form">
        <input class="remote-control-macros__field remote-control-macros__field--id" type="hidden"/>
        <input class="remote-control-macros__field remote-control-macros__field--title" type="text"/>
        <input class="remote-control-macros__field remote-control-macros__field--repeat" type="number" min="1"/>
        <textarea class="remote-control-macros__field remote-control-macros__field--steps"></textarea>
        <div class="remote-control-macros__form-buttons">
          <button class="remote-control-macros__form-button remote-control-macros__form-button--cancel">Cancel</button>
          <button class="remote-control-macros__form-button remote-control-macros__form-button--save">Save</button>
        </div>
      </div>
      <ul class="remote-control-macros__list"></ul>
    </div>
`;
  return { container };
}

const sendClick = async (value: number) => {
  try {
    const response = await ofetch(`/click?btn=${value.toString(10)}`, { timeout: 250 });
    if (response.result !== 'ok') { console.error(response); }
  } catch {
    console.error('timed out');
  }
}

const stepsToText = (steps: RemoteMacroStep[]): string => {
  return steps.map(({ key, delay, comment }) => (
    `${delay.toString(10)} ${buttonLabels[key]} ${comment.split('\n').filter(Boolean).join(' ')}`.trim()
  )).join('\n');
}

const textToSteps = (text: string): RemoteMacroStep[] => {
  const commands = text.split('\n');
  const steps: (RemoteMacroStep | null)[] = commands.map((command: string): RemoteMacroStep | null => {
    const [timeRaw, commandRaw, ...commentRaw] = command.split(' ');

    const delay = Math.max(MIN_STEP_DELAY, parseInt(timeRaw, 10) || 0);
    const key = getButtonValue(commandRaw || '');
    const comment = (commentRaw || []).filter(Boolean).join(' ')

    if (key === ButtonValues.NONE && delay === 0) {
      return null;
    }

    if (key) {
      return { delay, key, comment };
    }

    return null;
  });

  return steps.filter(Boolean) as RemoteMacroStep[];
}

const runMacro = async (macroId: string) => {
  const macro = macroStore.getMacro(macroId);
  if (!macro) { return; }

  const { steps, repeats } = macro;

  const fullSteps = Array.from({ length: repeats }, () => steps).flat()

  progressStart();
  let count = 0;

  for (let step of fullSteps) {
    const { delay, key } = step;
    progressUpdate(count / fullSteps.length);
    count += 1;
    await wait(delay);
    sendClick(parseInt(key, 16));
  }

  progressDone();
}

let macroList: HTMLUListElement | null = null;

export const updateMacroList = () => {
  if (!macroList) { return; }

  const macros = macroStore.getMacros();

  macroList.innerHTML = macros.map((macro: RemoteMacro) => (`
      <li class="remote-control-macros__list-entry" data-id="${macro.id}" title="${escape(macro.title)}\n${stepsToText(macro.steps)}">
        <span class="remote-control-macros__title">
          ${escape(macro.title)}
        </span>
        <span class="remote-control-macros__buttons">
          <button title="Edit macro" class="remote-control-macros__button" data-action="edit">${editIcon()}</button>
          <button title="Add macro" class="remote-control-macros__button" data-action="add">${addIcon()}</button>
          <button title="Delete macro" class="remote-control-macros__button" data-action="delete">${deleteIcon()}</button>
          <button title="Run macro" class="remote-control-macros__button" data-action="play">${playIcon()}</button>
        </span>
      </li>
    `)).join('');

  macroList.innerHTML = `
    <li class="remote-control-macros__list-entry" data-id=".">
      <span class="remote-control-macros__buttons">
        <button title="Switch to Controller" class="remote-control-macros__button" data-action="flip">${flipIcon()}</button>
        <button title="Add new macro" class="remote-control-macros__button" data-action="add">${addIcon()}</button>
      </span>
    </li>
    ${macroList.innerHTML}
    `
}


export const initMacros = (updateSetting: (value: RemoteControl) => void) => {
  const { container } = createDom();

  macroList = container.querySelector('.remote-control-macros__list') as HTMLUListElement;
  const editForm = container.querySelector('.remote-control-macros__form') as HTMLDivElement;
  const editIdField = editForm.querySelector('.remote-control-macros__field--id') as HTMLInputElement;
  const editTitleField = editForm.querySelector('.remote-control-macros__field--title') as HTMLInputElement;
  const editRepeatField = editForm.querySelector('.remote-control-macros__field--repeat') as HTMLInputElement;
  const editStepsField = editForm.querySelector('.remote-control-macros__field--steps') as HTMLTextAreaElement;
  const editStepsSave = editForm.querySelector('.remote-control-macros__form-button--save') as HTMLButtonElement;
  const editStepsCancel = editForm.querySelector('.remote-control-macros__form-button--cancel') as HTMLButtonElement;

  const showEditMacro = (id: string) => {
    const macro = macroStore.getMacro(id);
    if (!macro) { return; }
    editForm.classList.add('remote-control-macros__form--visible');
    editIdField.value = macro.id;
    editTitleField.value = macro.title;
    editRepeatField.value = macro.repeats.toString(10);
    editStepsField.value = stepsToText(macro.steps);
  }

  const hideEditMacro = () => {
    editForm.classList.remove('remote-control-macros__form--visible');
    editIdField.value = '';
    editTitleField.value = '';
    editRepeatField.value = '';
    editStepsField.value = '';
    updateMacroList();
  };

  editStepsCancel.addEventListener('click', hideEditMacro);

  editStepsSave.addEventListener('click', () => {
    const macroUpdate: RemoteMacro = {
      id: editIdField.value,
      title: editTitleField.value,
      repeats: Math.max(1, parseInt(editRepeatField.value, 10) || 1),
      steps: textToSteps(editStepsField.value),
    };

    macroStore.updateMacro(macroUpdate);
    hideEditMacro();
  });

  const drawerButton = container.querySelector('.remote-control-macros__drawer') as HTMLButtonElement;
  drawerButton.addEventListener('mousedown', () => {
    if (document.body.dataset.hideremote === HideRemoteControl.TRUE) {
      document.body.dataset.hideremote = HideRemoteControl.FALSE;
    } else {
      document.body.dataset.hideremote = HideRemoteControl.TRUE;
    }
    localStorage.setItem(LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY, document.body.dataset.hideremote)
  });

  updateMacroList();

  macroList.addEventListener('mousedown', (ev) => {
    const button = ev.target as HTMLButtonElement;
    const macroNode = (button.parentNode?.parentNode as HTMLLIElement | undefined) || null;

    if (!macroNode) { return; }

    const action = button.dataset.action;
    const macroId = macroNode.dataset.id;

    if (!macroId) { return; }

    switch (action) {
      case 'add': {
        showEditMacro(macroStore.addNew(macroId));
        updateMacroList();
        break;
      }

      case 'edit': {
        showEditMacro(macroId);
        break;
      }

      case 'delete': {
        macroStore.delete(macroId);
        updateMacroList();
        break;
      }

      case 'play': {
        runMacro(macroId);
        break;
      }

      case 'flip': {
        updateSetting(RemoteControl.CONTROLLER);
        break;
      }

      default:
    }
  });
}
