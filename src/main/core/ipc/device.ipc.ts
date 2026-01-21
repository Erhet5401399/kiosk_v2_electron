import { IpcMain } from "electron";
import { DeviceService } from "../../services/deviceService";

export default function registerDeviceIPC(ipcMain: IpcMain) {
  const device = DeviceService.getInstance();

  ipcMain.handle("device:status", () => ({
    deviceId: device.getDeviceId(),
    registered: device.isRegistered(),
  }));
}
