import fs from "fs";
import path from "path";
import { app, BrowserWindow } from "electron";
import { print, getPrinters as listPrinters } from "pdf-to-printer";

export interface PrinterDevice {
  name: string;
  isDefault: boolean;
  options?: Record<string, any>;
}

export class PrinterService {
  static async getPrinters(): Promise<PrinterDevice[]> {
    const rawPrinters = await listPrinters();
    return rawPrinters.map((p: any, index: number) => {
      const name = typeof p === "string" ? p : p.name;
      return {
        name,
        isDefault: index === 0,
        options: {},
      };
    });
  }

  static async findLexmarkMS430(): Promise<PrinterDevice | null> {
    const printers = await this.getPrinters();
    return printers.find((p) => p.name.includes("Lexmark MS430 Series")) || null;
  }

  static async printRaw(content: string, printerName?: string): Promise<string> {
    const win = new BrowserWindow({ show: false });
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`);

    const pdfBuffer = await win.webContents.printToPDF({ printBackground: true });

    const tempPath = path.join(app.getPath("temp"), "temp_print.pdf");
    fs.writeFileSync(tempPath, pdfBuffer);

    win.close();

    await print(tempPath, { printer: printerName });

    return `Print job sent to ${printerName || "default printer"}`;
  }
}
