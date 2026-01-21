import { IpcMain } from "electron";
import AuthService from "../../services/authService";

export default function registerAuthIPC(ipcMain: IpcMain) {
  const auth = AuthService.getInstance();

  ipcMain.handle("auth:authenticate", async () => {
    return auth.authenticate();
  });

  ipcMain.handle("auth:logout", async () => {});
}
