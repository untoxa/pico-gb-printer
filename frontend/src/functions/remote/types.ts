
export enum PrinterFunction {
  CHECKPRINTER = 'checkPrinter',
  FETCHIMAGES = 'fetchImages',
  CLEARPRINTER = 'clearPrinter',
}

export type FromPrinterEvent = Partial<CheckPrinterStatus & PrinterImages & {
  commands: PrinterFunction[],
  height: number,
}>

export interface ToPrinterEvent {
  command: string,
  params?: PrinterParams,
}

export type RemotePrinterEvent = Partial<{
  fromRemotePrinter: FromPrinterEvent,
  toRemotePrinter: ToPrinterEvent,
}>

export interface PrinterInfo {
  dumps: string[],
  message?: string,
}

export interface CheckPrinterStatus {
  printerData: PrinterInfo,
}

export interface PrinterParams {
  dumps: string[],
}

export interface PrinterImages {
  blobsdone: BlobResponse[],
}

export interface BlobResponse {
  ok: boolean,
  blob: Blob,
  contentType: string,
  status: number,
}

export type StatusFn = () => Promise<CheckPrinterStatus>;
export type ImagesFn = (dumps: string[]) => Promise<PrinterImages>;

export interface PrinterCommand {
  name: PrinterFunction,
  fn: StatusFn | ImagesFn,
}
