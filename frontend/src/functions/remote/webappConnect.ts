import { DbAccess } from '../database.ts';
import checkPrinter from './checkPrinter.ts';
import clearPrinter from './clearPrinter.ts';
import fetchImages from './fetchImages.ts';
import startHeartbeat from './startHeartbeat.ts';
import {
  CheckPrinterStatus,
  ImagesFn,
  PrinterCommand,
  PrinterFunction,
  PrinterImages,
  PrinterParams,
  RemotePrinterEvent,
  StatusFn,
} from './types.ts';

export const webappConnect = (store: DbAccess, targetWindow: Window) => {
  const content = [...document.querySelectorAll('#header h1,#header button,#gallery')] as HTMLElement[];
  for (const node of content) {
    node.style.display = 'none';
  }

  const remoteText = document.createElement('div');
  remoteText.innerHTML = '<h1>You are connected to a remote application.</h1><p>Do not close this window during the process</p>';

  document.querySelector('#header')?.appendChild(remoteText);

  const commands: PrinterCommand[] = [
    {
      name: PrinterFunction.CHECKPRINTER,
      fn: checkPrinter(store),
    },
    {
      name: PrinterFunction.FETCHIMAGES,
      fn: fetchImages(store),
    },
    {
      name: PrinterFunction.CLEARPRINTER,
      fn: clearPrinter(store),
    },
  ];


  window.addEventListener('message', async (event: MessageEvent<RemotePrinterEvent>) => {
    if (event.source !== targetWindow) {
      return;
    }

    const printerCommand = event.data.toRemotePrinter;
    if (!printerCommand) {
      return;
    }

    let fromRemotePrinter: CheckPrinterStatus | PrinterImages | null;

    switch (printerCommand.command) {
      case PrinterFunction.FETCHIMAGES: {
        const commandFn = commands.find(({ name }) => name === printerCommand.command) as PrinterCommand;
        const dumps = (printerCommand.params as PrinterParams)?.dumps || [];
        fromRemotePrinter = await (commandFn.fn as ImagesFn)(dumps);
        break;
      }

      case PrinterFunction.CLEARPRINTER:
      case PrinterFunction.CHECKPRINTER: {
        const commandFn = commands.find(({ name }) => name === printerCommand.command) as PrinterCommand;
        fromRemotePrinter = await (commandFn.fn as StatusFn)();
        break;
      }

      default:
        fromRemotePrinter = null;
    }

    if (fromRemotePrinter) {
      targetWindow.postMessage({
        fromRemotePrinter,
      } as RemotePrinterEvent, '*');
    }
  });

  startHeartbeat(targetWindow, commands.map(({ name }) => name));
}
