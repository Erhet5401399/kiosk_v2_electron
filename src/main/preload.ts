import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  authenticate: () => ipcRenderer.invoke("auth:authenticate"),
  getDeviceConfig: () => ipcRenderer.invoke("device:getConfig"),
  print: (text: string) => ipcRenderer.invoke("printer:print", text),
  getDeviceId: () => ipcRenderer.invoke("device:getId"),
});
