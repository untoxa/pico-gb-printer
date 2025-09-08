import { ButtonValues } from './buttonValues.ts';
import {LOCALSTORAGE_MACROS_KEY} from "../../consts.ts";

export interface RemoteMacroStep {
  delay: number,
  key: ButtonValues,
  comment: string,
}

export interface RemoteMacro {
  id: string,
  title: string,
  repeats: number,
  steps: RemoteMacroStep[],
}

export type MacroDefaults = Partial<Omit<RemoteMacro, 'id'>>;

class MacroStore {
  getMacros(): RemoteMacro[] {
    return JSON.parse(localStorage.getItem(LOCALSTORAGE_MACROS_KEY) || '[]');
  }

  saveMacros(macros: RemoteMacro[]): void {
    localStorage.setItem(LOCALSTORAGE_MACROS_KEY, JSON.stringify(macros));
  }

  newMacro(defaults: MacroDefaults = {}): RemoteMacro {
    return {
      id: Math.random().toString(16).split('.')[1],
      title: 'New Macro',
      repeats: 1,
      steps: [],
      ...defaults,
    }
  }

  updateMacro(updateMacro: RemoteMacro): void {
    this.saveMacros(this.getMacros().map((macro) =>
      macro.id === updateMacro.id ? updateMacro : macro
    ))
  }

  addNew(addBeforeId: string, defaults: MacroDefaults = {}): string {
    const macros = this.getMacros();
    const insertIndex = macros.findIndex(({ id }) => id === addBeforeId);
    const newMacro = this.newMacro(defaults);

    this.newMacro(defaults)
    if (insertIndex !== -1) {
      macros.splice(insertIndex, 0, newMacro)
      this.saveMacros(macros);
    } else {
      this.saveMacros([newMacro, ...macros]);
    }

    return newMacro.id;
  }

  delete(deleteId: string): void {
    const macros = this.getMacros()
      .filter(({ id }) => id !== deleteId);

    this.saveMacros(macros);
  }

  getMacro(getId: string): RemoteMacro | null {
    return this.getMacros().find(({ id }) => id === getId) || null;
  }
}

export const macroStore = new MacroStore();
