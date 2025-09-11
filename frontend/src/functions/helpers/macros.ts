import {RemoteMacroStep} from "../remoteControl/macroStore.ts";
import {buttonLabels, getButtonValue} from "../remoteControl/buttonValues.ts";
import {MIN_STEP_DELAY} from "../../consts.ts";

export const stepsToText = (steps: RemoteMacroStep[]): string => {
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

export const textToSteps = (text: string): {
  steps: RemoteMacroStep[],
  valid: boolean,
} => {
  const commands = text.split('\n').filter(Boolean);

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

  const validSteps = steps.filter(Boolean) as RemoteMacroStep[]

  return {
    steps: validSteps,
    valid: commands.length === validSteps.length,
  };
}
