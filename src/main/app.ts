import { createMainWindow, createRegisterWindow } from "./windows";
import { DeviceRuntime } from "./core/deviceRuntime";
import setupIPC from "./core/ipc";

export async function startApp() {
  setupIPC();

  const runtime = DeviceRuntime.getInstance();

  await runtime.initialize();

  if (runtime.isRegistrationRequired()) {
    createRegisterWindow(runtime.getDeviceId());
    return;
  }

  createMainWindow();
}
