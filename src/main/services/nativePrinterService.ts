import * as Printer from '../devices/printer';

export class NativePrinterService {
  private printerName: string;

  constructor(targetPrinter?: string) {
    if (targetPrinter) {
      const printer = Printer.listPrinters().find(p => p.name.includes(targetPrinter));
      if (!printer) throw new Error(`Printer "${targetPrinter}" not found`);
      this.printerName = printer.name;
    } else {
      const defaultPrinter = Printer.getDefaultPrinter();
      if (!defaultPrinter) throw new Error('No default printer found');
      this.printerName = defaultPrinter.name;
    }
  }

  getName(): string {
    return this.printerName;
  }

  async printText(text: string): Promise<number> {
    const jobId = await Printer.printText(this.printerName, text);
    return jobId;
  }

  async printPDFBuffer(buffer: Buffer): Promise<number> {
    const jobId = await Printer.printPDFBuffer(this.printerName, buffer);
    return jobId;
  }

  getJob(jobId: number) {
    return Printer.getPrintJob(this.printerName, jobId);
  }
}
