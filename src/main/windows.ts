import { BrowserWindow } from "electron";
import path from "path";
import serve from "electron-serve";

const loadURL = serve({ directory: path.join(__dirname, "../dist") });

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
  const win = createBaseWindow({
    width: 600,
    height: 400,
  });

  const url =
    process.env.NODE_ENV === "development"
      ? `http://localhost:5173/#/register?deviceId=${deviceId}`
      : `file://${path.join(__dirname, "../dist/index.html")}#/register?deviceId=${deviceId}`;

  win.loadURL(url);
  win.once("ready-to-show", () => win.show());

  return win;
}

export function createMainWindow() {
  const win = createBaseWindow({
    width: 1200,
    height: 800,
    kiosk: true,
  });

  process.env.NODE_ENV === "development"
    ? win.loadURL("http://localhost:5173")
    : loadURL(win);

  win.once("ready-to-show", () => win.show());

  return win;
}
