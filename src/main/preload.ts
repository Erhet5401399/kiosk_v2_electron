import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  getRuntimeSnapshot: () => ipcRenderer.invoke("runtime-snapshot"),

  onRuntimeState: (cb: (snapshot: any) => void) => {
    ipcRenderer.on("runtime-state", (_, snapshot) => cb(snapshot));
    return () => ipcRenderer.removeAllListeners("runtime-state");
  },
});
