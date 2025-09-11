import { escape, sendClick } from '../helpers';
import { stepsToText, textToSteps } from '../helpers/macros.ts';
import { macroStore, RemoteMacro } from './macroStore.ts';
import { progressDone, progressStart, progressUpdate } from '../progress';
import { delay as wait } from '../delay.ts';
import { HideRemoteControl, LOCALSTORAGE_HIDE_REMOTE_CONTROL_KEY, RemoteControl } from '../../consts.ts';
import { addIcon, deleteIcon, editIcon, gamePadIcon, playIcon } from '../icons';
import { ButtonValues } from './buttonValues.ts';
import './macros.scss';

const createDom = (): { container: HTMLDivElement } => {
  const container = document.querySelector('.remote-control-macros') as HTMLDivElement;
  container.innerHTML = `
    <div class="remote-control-macros__wrapper">
      <button class="remote-control-macros__drawer" title="Show/Hide Macro Window">== Macros ==</button>
      <button title="Switch to Controller" class="remote-control-macros__meta-button" data-action="flip">${gamePadIcon()}</button>
      <div class="remote-control-macros__form">
        <input class="remote-control-macros__field-input remote-control-macros__field-input--id" type="hidden"/>
        <label class="remote-control-macros__field-label" title="Macro Title">
          <span class="remote-control-macros__field-label-text">Macro Title</span>
          <input class="remote-control-macros__field-input remote-control-macros__field-input--title" type="text"/>
        </label>
        <label class="remote-control-macros__field-label" title="Repeats">
          <span class="remote-control-macros__field-label-text">Repeats</span>
          <input class="remote-control-macros__field-input remote-control-macros__field-input--repeat" type="number" min="1"/>
        </label>
        <label class="remote-control-macros__field-label remote-control-macros__field-label--steps" title="Steps">
          <span class="remote-control-macros__field-label-text">Steps</span>    
          <textarea class="remote-control-macros__field-input remote-control-macros__field-input--steps"></textarea>
        </label>
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

const runMacro = async (macroId: string) => {
  const macro = macroStore.getMacro(macroId);
  if (!macro || !macro.steps.length) { return; }

  const { steps, repeats } = macro;

  const fullSteps = Array.from({ length: repeats }, () => steps).flat()

  await progressStart();
  let count = 0;

  for (let step of fullSteps) {
    const { delay, key } = step;

    await progressUpdate(count / fullSteps.length);
    count += 1;

    await wait(delay);

    if (key !== ButtonValues.NONE) {
      await sendClick(parseInt(key, 16));
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
          <span class="remote-control-macros__repeats">
            ${macro.repeats}×
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
  const editIdField = editForm.querySelector('.remote-control-macros__field-input--id') as HTMLInputElement;
  const editTitleField = editForm.querySelector('.remote-control-macros__field-input--title') as HTMLInputElement;
  const editRepeatField = editForm.querySelector('.remote-control-macros__field-input--repeat') as HTMLInputElement;
  const editStepsField = editForm.querySelector('.remote-control-macros__field-input--steps') as HTMLTextAreaElement;
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
    const { steps, valid } = textToSteps(editStepsField.value);

    if (!valid) { return; }

    const macroUpdate: RemoteMacro = {
      id: editIdField.value,
      title: editTitleField.value.trim(),
      repeats: Math.max(1, parseInt(editRepeatField.value, 10) || 1),
      steps,
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

  const validate = () => {
    const titleValue = editTitleField.value.trim();
    const titleValid = titleValue !== '' && escape(titleValue) === titleValue;
    editTitleField.classList[titleValid ? 'remove' : 'add']('remote-control-macros__field-input--error')

    const repeatsValue = parseInt(editRepeatField.value, 10);
    const repeatsValid = !isNaN(repeatsValue) && repeatsValue > 0;
    editRepeatField.classList[repeatsValid ? 'remove' : 'add']('remote-control-macros__field-input--error')

    const { valid: stepsValid } = textToSteps(editStepsField.value);
    editStepsField.classList[stepsValid ? 'remove' : 'add']('remote-control-macros__field-input--error')

    editStepsSave.disabled = !titleValid || !repeatsValid || !stepsValid;
  }

  macroList.addEventListener('mousedown', handleClick);
  flipButton.addEventListener('mousedown', handleClick);
  editTitleField.addEventListener('input', validate);
  editRepeatField.addEventListener('input', validate);
  editStepsField.addEventListener('input', validate);
  updateMacroList();
}
