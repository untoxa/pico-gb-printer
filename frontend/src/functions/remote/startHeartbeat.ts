import { RemotePrinterEvent } from './types.ts';

const startHeartbeat = (targetWindow: Window, commands: string[]) => {

  const heartBeat = () => {
    targetWindow.postMessage({
      fromRemotePrinter: {
        height: document.body.getBoundingClientRect().height,
        commands,
      },
    } as RemotePrinterEvent, '*');
  };

  window.setInterval(heartBeat, 500);
  heartBeat();
};

export default startHeartbeat;
