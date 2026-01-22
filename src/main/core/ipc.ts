import { ipcMain, BrowserWindow } from "electron";
import { DeviceRuntime } from "../core/deviceRuntime";

export default function setupIPC() {
  const runtime = DeviceRuntime.getInstance();

  ipcMain.handle("runtime-snapshot", () => {
    return runtime.getSnapshot();
  });

  runtime.on("state-change", (state) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("runtime-state", runtime.getSnapshot());
    });
  });
}
