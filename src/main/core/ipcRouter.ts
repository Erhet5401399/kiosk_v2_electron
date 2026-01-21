import { ipcMain } from "electron";
import { DeviceConfigService } from "../services/deviceConfigService";
import AuthService from "../services/authService";
import { PrinterService } from "../services/printerService";
import { DeviceService } from "../services/deviceService";

export default function setupIPC() {
  const auth = AuthService.getInstance();
  const printer = PrinterService.getInstance();
  const deviceConfig = DeviceConfigService.getInstance();
  const deviceService = DeviceService.getInstance();

  ipcMain.handle("auth:authenticate", () => auth.authenticate());
  ipcMain.handle("device:getConfig", () => deviceConfig.fetchConfig());
  ipcMain.handle("printer:print", (_e, text: string) => printer.printDocument(text));
  ipcMain.handle("device:getId", () => deviceService.getDeviceId());
}
