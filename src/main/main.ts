import { app } from "electron";
import { startApp } from "./app";

app.whenReady().then(startApp);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
