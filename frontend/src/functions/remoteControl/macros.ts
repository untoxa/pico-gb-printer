import { escape, sendClick } from '../helpers';
import { macroStore, RemoteMacro, RemoteMacroStep } from './macroStore.ts';
import { progressDone, progressStart, progressUpdate } from '../progress';
import { delay as wait } from '../delay.ts';
import { HideRemoteControl, LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY, MIN_STEP_DELAY, RemoteControl } from '../../consts.ts';
import { addIcon, deleteIcon, editIcon, gamePadIcon, playIcon } from '../icons';
import { buttonLabels, ButtonValues, getButtonValue } from './buttonValues.ts';
import './macros.scss';

const createDom = (): { container: HTMLDivElement } => {
  const container = document.querySelector('.remote-control-macros') as HTMLDivElement;
  container.innerHTML = `
    <div class="remote-control-macros__wrapper">
      <button class="remote-control-macros__drawer" title="Show/Hide Macro Window">== Macros ==</button>
      <button title="Switch to Controller" class="remote-control-macros__meta-button" data-action="flip">${gamePadIcon()}</button>
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

const stepsToText = (steps: RemoteMacroStep[]): string => {
  return steps.map((step) => {
    return [
      `${step.delay.toString(10)}ms`.split('000ms').join('s'),
      buttonLabels[step.key],
      step.comment ? `#${step.comment}` : '',
    ]
      .filter(Boolean)
      .join(' ');
  }).join('\n');
}

const lineRegex = /^(?<delay>\d+)(?<unit>ms|s)\s+(?<key>\w+)(?:\s+#(?<comment>.*))?$/;

const textToSteps = (text: string): RemoteMacroStep[] => {
  const commands = text.split('\n');
  const steps: (RemoteMacroStep | null)[] = commands.map((line: string): RemoteMacroStep | null => {
    const match = line.trim().match(lineRegex);
    if (!match || !match.groups) return null;

    const rawDelay = parseInt(match.groups.delay, 10);
    const delay = Math.max(MIN_STEP_DELAY, match.groups.unit === 's' ? rawDelay * 1000 : rawDelay);

    const key = getButtonValue(match.groups.key || '');
    const comment = match.groups.comment || '';

    if (key) {
      return { delay, key, comment };
    }

    return null;
  });

  return steps.filter(Boolean) as RemoteMacroStep[];
}

const runMacro = async (macroId: string) => {
  const macro = macroStore.getMacro(macroId);
  if (!macro || !macro.steps.length) { return; }

  const { steps, repeats } = macro;

  const fullSteps = Array.from({ length: repeats }, () => steps).flat()

  progressStart();
  let count = 0;

  for (let step of fullSteps) {
    const { delay, key } = step;

    progressUpdate(count / fullSteps.length);
    count += 1;

    await wait(delay);

    if (key !== ButtonValues.NONE) {
      sendClick(parseInt(key, 16));
    }
  }

  progressDone();
}

let macroList: HTMLUListElement | null = null;

export const updateMacroList = () => {
  if (!macroList) { return; }

  const macros = macroStore.getMacros();

  if (macros.length) {
    macroList.innerHTML = macros.map((macro: RemoteMacro) => (`
        <li class="remote-control-macros__list-entry" title="${escape(macro.title)}\n${stepsToText(macro.steps)}">
          <span class="remote-control-macros__title">
            ${escape(macro.title)}
          </span>
          <span class="remote-control-macros__buttons">
            <button title="Edit macro" class="remote-control-macros__button" data-id="${macro.id}" data-action="edit">${editIcon()}</button>
            <button title="Delete macro" class="remote-control-macros__button" data-id="${macro.id}" data-action="delete">${deleteIcon()}</button>
            <button title="Add macro" class="remote-control-macros__button" data-id="${macro.id}" data-action="add">${addIcon()}</button>
            <button title="Run macro" class="remote-control-macros__button" data-id="${macro.id}" data-action="play">${playIcon()}</button>
          </span>
        </li>`
      )
    ).join('');
  } else {
    macroList.innerHTML = `
      <li class="remote-control-macros__list-entry">
        <span class="remote-control-macros__title">
          No macros
        </span>
        <span class="remote-control-macros__buttons">
          <button title="Add new macro" class="remote-control-macros__button" data-action="add">${addIcon()}</button>
        </span>
      </li>`;
  }
}


export const initMacros = (updateSetting: (value: RemoteControl) => void) => {
  const { container } = createDom();

  macroList = container.querySelector('.remote-control-macros__list') as HTMLUListElement;
  const flipButton = container.querySelector('.remote-control-macros__meta-button[data-action="flip"]') as HTMLDivElement;
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

  editStepsCancel.addEventListener('click', () => {
    if (
      editTitleField.value == 'New Macro' &&
      editRepeatField.value == '1' &&
      editStepsField.value == ''
    ) {
      macroStore.delete(editIdField.value);
      updateMacroList();
    }

    hideEditMacro();
  });

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

  const handleClick = (ev: MouseEvent) => {
    const button = ev.target as HTMLButtonElement;

    const action = button.dataset.action;
    const macroId= button.dataset.id || '';

    if (!action) { return; }

    switch (action) {
      case 'add': {
        showEditMacro(macroStore.addNew(macroId));
        updateMacroList();
        break;
      }

      case 'flip': {
        updateSetting(RemoteControl.CONTROLLER);
        break;
      }


      case 'edit': {
        if (macroId) {
          showEditMacro(macroId);
        }
        break;
      }

      case 'delete': {
        if (macroId) {
          macroStore.delete(macroId);
          updateMacroList();
        }
        break;
      }

      case 'play': {
        if (macroId) {
          runMacro(macroId);
        }
        break;
      }

      default:
    }
  };

  macroList.addEventListener('mousedown', handleClick);
  flipButton.addEventListener('mousedown', handleClick);
  updateMacroList();
}
