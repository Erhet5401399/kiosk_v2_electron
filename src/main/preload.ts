import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  getDeviceStatus: () => ipcRenderer.invoke("device:status"),
  authenticate: () => ipcRenderer.invoke("auth:authenticate"),
  print: (text: string) => ipcRenderer.invoke("device:print", text),
});
