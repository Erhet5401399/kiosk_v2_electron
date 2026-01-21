import { app, BrowserWindow } from "electron";
import path from "path";
import serve from "electron-serve";

import setupIPC from "./core/ipcRouter";
import AuthService from "./services/authService";
import { DeviceConfigService } from "./services/deviceConfigService";
import { DeviceService } from "./services/deviceService";

const loadURL = serve({ directory: path.join(__dirname, "../dist") });

async function bootstrap() {
  const deviceService = DeviceService.getInstance();
  const deviceId = deviceService.getDeviceId();

  if (!deviceService.isRegistered()) {
    const win = new BrowserWindow({
      width: 600,
      height: 400,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
      },
    });

    if (process.env.NODE_ENV === "development") {
      win.loadURL(`http://localhost:5173/#/register?deviceId=${deviceId}`);
    } else {
      loadURL(win);
    }

    return;
  }

  const authService = AuthService.getInstance();
  const token = await authService.authenticate();
  console.log("Device authenticated. Token:", token);

  const configService = DeviceConfigService.getInstance();
  const config = await configService.fetchConfig();
  console.log("Device config loaded:", config);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    loadURL(win);
  }

  win.webContents.openDevTools();

  setupIPC();
}

app.whenReady().then(bootstrap);
