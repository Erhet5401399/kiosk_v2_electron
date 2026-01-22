import { ipcMain, BrowserWindow } from "electron";
import { DeviceRuntime } from "../core/deviceRuntime";
import { PrinterService } from "../services/printerService";

export default function setupIPC() {
  const runtime = DeviceRuntime.getInstance();

  ipcMain.handle("runtime-snapshot", () => {
    return runtime.getSnapshot();
  });

  runtime.on("state-change", () => {
    const snapshot = runtime.getSnapshot();
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("runtime-state", snapshot);
    });
  });

  ipcMain.handle("print", async (_event, content: string) => {
    try {
      const printer = await PrinterService.findLexmarkMS430();
      if (!printer) {
        throw new Error("Printer not found");
      }

      const result = await PrinterService.printRaw(content, printer.name);
      return { success: true, message: result };
    } catch (err: any) {
      console.error("Print error:", err);
      return { success: false, message: err.message || "Unknown error" };
    }
  });
}
