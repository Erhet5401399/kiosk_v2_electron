import { contextBridge, ipcRenderer } from "electron";

const IPC = {
  RUNTIME_SNAPSHOT: "runtime:snapshot",
  RUNTIME_UPDATE: "runtime:update",
  RUNTIME_RETRY: "runtime:retry",
  RUNTIME_RESET: "runtime:reset",
  PRINT: "hardware:print",
  PRINTERS: "hardware:printers",
  CONFIG_GET: "config:get",
  CONFIG_REFRESH: "config:refresh",
  HEALTH: "health:status",
} as const;

const api = {
  runtime: {
    getSnapshot: () => ipcRenderer.invoke(IPC.RUNTIME_SNAPSHOT),
    onUpdate: (cb: (snap: unknown) => void) => {
      const handler = (_: unknown, snap: unknown) => cb(snap);
      ipcRenderer.on(IPC.RUNTIME_UPDATE, handler);
      return () => ipcRenderer.removeListener(IPC.RUNTIME_UPDATE, handler);
    },
    retry: () => ipcRenderer.invoke(IPC.RUNTIME_RETRY),
    reset: () => ipcRenderer.invoke(IPC.RUNTIME_RESET),
  },

  config: {
    get: () => ipcRenderer.invoke(IPC.CONFIG_GET),
    refresh: () => ipcRenderer.invoke(IPC.CONFIG_REFRESH),
  },

  printer: {
    print: (req: {
      content: string;
      type?: string;
      copies?: number;
      priority?: string;
    }) => ipcRenderer.invoke(IPC.PRINT, req),
    list: () => ipcRenderer.invoke(IPC.PRINTERS),
  },

  health: {
    getStatus: () => ipcRenderer.invoke(IPC.HEALTH),
  },

  platform: {
    isElectron: true,
    platform: process.platform,
    version: process.versions.electron,
  },
};

contextBridge.exposeInMainWorld("electron", api);
