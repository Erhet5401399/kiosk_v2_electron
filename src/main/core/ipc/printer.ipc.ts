import { IpcMain } from "electron";
import { PrinterService } from "../../services/printerService";

export default function registerPrinterIPC(ipcMain: IpcMain) {
  const printer = PrinterService.getInstance();

  ipcMain.handle("device:print", async (_e, text: string) => {
    if (!text) throw new Error("Nothing to print");
    return printer.printDocument(text);
  });
}
