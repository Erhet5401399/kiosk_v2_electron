import { ipcMain, BrowserWindow, app } from "electron";
import { DeviceRuntime } from "../core/deviceRuntime";
// import { NativePrinterService } from "../services/nativePrinterService";
// import path from "path";
import { PrinterService } from "../services/printerService";

// const printerService = new NativePrinterService('Lexmark MS430');
// const pdfPath = path.join(app.getAppPath(), 'src', 'pdfs', 'test.pdf');

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

  // ipcMain.handle("native-print", async (_event, content: string) => {
  //   try {
  //     // const result = await NativePrinterService.printPDF(Buffer.from(content), "Lexmark MS430 Series");
  //     const pdfBuffer = fs.readFileSync(pdfPath);
  //     const result = await printerService.printPDFBuffer(pdfBuffer);
  //     console.log(result, "Successfully printed");
  //   } catch (error) {
  //     console.error("Print error:", error);
  //     return { success: false, message: "Unknown error" };
  //   }
  // });
}
