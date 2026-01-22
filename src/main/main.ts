import { app } from "electron";
import { startApp } from "./app";
import setupIPC from "./core/ipc";

app.whenReady().then(() => {
  setupIPC();
  startApp();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
