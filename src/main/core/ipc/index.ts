import { ipcMain } from "electron";

import registerAuthIPC from "./auth.ipc";
import registerDeviceIPC from "./device.ipc";
import registerPrinterIPC from "./printer.ipc";

export default function setupIPC() {
  registerAuthIPC(ipcMain);
  registerDeviceIPC(ipcMain);
  registerPrinterIPC(ipcMain);
}
