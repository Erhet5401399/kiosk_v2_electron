import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("electron", {
  hello: () => "Hello from Electron!"
});
