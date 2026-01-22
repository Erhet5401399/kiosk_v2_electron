import { createMainWindow, createRegisterWindow } from "./windows";
import { DeviceRuntime } from "./core/deviceRuntime";
import { BrowserWindow } from "electron";

export function startApp() {
  const runtime = DeviceRuntime.getInstance();

  runtime.on("state-change", (state) => {
    const snapshot = runtime.getSnapshot();

    if (state === "unregistered") {
      if (BrowserWindow.getAllWindows().length === 0) {
        createRegisterWindow(snapshot.deviceId);
      }
    }

    if (state === "ready") {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    }
  });

  runtime.start().catch((err) => {
    console.error("Runtime failed to start:", err);
  });
}
