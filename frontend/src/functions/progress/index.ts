import { delay } from '../delay.ts';
import './progress.scss';

let progressContainer: HTMLDivElement | null = null;
let progressInner: HTMLDivElement | null = null;

const createDom = (): { container: HTMLDivElement, backdrop: HTMLDivElement } => {
  const container = document.querySelector('.progress') as HTMLDivElement;

  container.innerHTML = '<div class="progress__inner"></div>';

  const backdrop = document.createElement('div');
  backdrop.classList.add('backdrop');
  (container.parentNode as HTMLElement).insertBefore(backdrop, container.nextSibling);

  return {
    container,
    backdrop
  };
}

export const progressStart = async () => {
  if (!progressContainer) {
    const { container } = createDom();
    progressContainer = container;
    progressInner = container.querySelector('.progress__inner') as HTMLDivElement;
  }

  progressContainer.classList.add('progress--visible');
  await delay(1);
}

export const progressUpdate = async (value: number) => {
  if (!progressInner) {
    const { container } = createDom();
    progressContainer = container;
    progressInner = container.querySelector('.progress__inner') as HTMLDivElement;
  }

  progressInner.style.width = `${Math.floor(value * 100)}%`;
  await delay(1);
};

export const progressDone = () => {
  if (!progressContainer || !progressInner) {
    const { container } = createDom();
    progressContainer = container;
    progressInner = container.querySelector('.progress__inner') as HTMLDivElement;
  }

  progressContainer.classList.remove('progress--visible');
  progressInner.style.width = '0';
}

