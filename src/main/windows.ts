import { BrowserWindow } from "electron";
import path from "path";
import serve from "electron-serve";

const loadURL = serve({ directory: path.join(__dirname, "../dist") });

let mainWindow: BrowserWindow | null = null;
let registerWindow: BrowserWindow | null = null;

function createBaseWindow(options = {}) {
  return new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
    ...options,
  });
}

export function createRegisterWindow(deviceId: string) {
  if (registerWindow) return registerWindow;

  registerWindow = createBaseWindow({
    width: 1200,
    height: 800,
    kiosk: true,
  });

  const url =
    process.env.NODE_ENV === "development"
      ? `http://localhost:5173/#/register?deviceId=${deviceId}`
      : `file://${path.join(__dirname, "../dist/index.html")}#/register?deviceId=${deviceId}`;

  registerWindow.loadURL(url);
  registerWindow.once("ready-to-show", () => registerWindow?.show());

  registerWindow.on("closed", () => {
    registerWindow = null;
  });

  return registerWindow;
}

export function createMainWindow() {
  if (mainWindow) return mainWindow;

  mainWindow = createBaseWindow({
    width: 1200,
    height: 800,
    kiosk: true,
  });

  process.env.NODE_ENV === "development"
    ? mainWindow.loadURL("http://localhost:5173")
    : loadURL(mainWindow);

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

export function closeRegisterWindow() {
  if (!registerWindow) return;
  registerWindow.close();
  registerWindow = null;
}
