import {
  getPrinters,
  getPrinter,
  getDefaultPrinterName,
  printDirect,
  PrintDirectOptions,
  PrinterDetails,
  JobDetails,
  getJob,
} from '@thesusheer/electron-printer';

export function listPrinters(): PrinterDetails[] {
  return getPrinters();
}

export function getDefaultPrinter(): PrinterDetails | undefined {
  const name = getDefaultPrinterName();
  if (!name) return undefined;
  return getPrinter(name);
}

export function printText(printerName: string, text: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const options: PrintDirectOptions = {
      data: Buffer.from(text, 'utf8'),
      printer: printerName,
      type: 'RAW',
      success: (jobId) => resolve(Number(jobId)),
      error: reject,
    };
    try {
      printDirect(options);
    } catch (err) {
      reject(err);
    }
  });
}

export function printPDFBuffer(printerName: string, buffer: Buffer): Promise<number> {
  return new Promise((resolve, reject) => {
    const options: PrintDirectOptions = {
      data: buffer,
      printer: printerName,
      type: 'RAW',
      success: (jobId) => resolve(Number(jobId)),
      error: reject,
    };
    try {
      printDirect(options);
    } catch (err) {
      reject(err);
    }
  });
}

export function getPrintJob(printerName: string, jobId: number): JobDetails {
  return getJob(printerName, jobId);
}
