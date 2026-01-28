import { contextBridge, ipcRenderer } from "electron";

const api = {
  runtime: {
    getSnapshot: () => ipcRenderer.invoke("runtime:snapshot"),
    onUpdate: (cb: (snap: unknown) => void) => {
      const handler = (_: unknown, snap: unknown) => cb(snap);
      ipcRenderer.on("runtime:update", handler);
      return () => ipcRenderer.removeListener("runtime:update", handler);
    },
    retry: () => ipcRenderer.invoke("runtime:retry"),
    reset: () => ipcRenderer.invoke("runtime:reset"),
  },

  config: {
    get: () => ipcRenderer.invoke("config:get"),
    refresh: () => ipcRenderer.invoke("config:refresh"),
  },

  printer: {
    print: (req: {
      content: string;
      type?: string;
      copies?: number;
      priority?: string;
    }) => ipcRenderer.invoke("hardware:print", req),
    list: () => ipcRenderer.invoke("hardware:printers"),
  },

  health: {
    getStatus: () => ipcRenderer.invoke("health:status"),
  },

  parcel: {
    list: (register: string) => ipcRenderer.invoke("parcel:list", register),
  },

  platform: {
    isElectron: true,
    platform: process.platform,
    version: process.versions.electron,
  },
};

contextBridge.exposeInMainWorld("electron", api);
