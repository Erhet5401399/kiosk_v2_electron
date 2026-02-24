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

  updater: {
    getStatus: () => ipcRenderer.invoke("update:status"),
    check: () => ipcRenderer.invoke("update:check"),
    install: () => ipcRenderer.invoke("update:install"),
    onStatus: (cb: (status: unknown) => void) => {
      const handler = (_: unknown, status: unknown) => cb(status);
      ipcRenderer.on("update:event", handler);
      return () => ipcRenderer.removeListener("update:event", handler);
    },
  },

  parcel: {
    list: (register: string) => ipcRenderer.invoke("parcel:list", register),
    categories: () => ipcRenderer.invoke("category:list"),
  },

  service: {
    freeLandOwnerReference: (register: string) =>
      ipcRenderer.invoke("service:free-land-owner-reference", register),
  },

  promotion: {
    list: () => ipcRenderer.invoke("promotion:list"),
    refresh: () => ipcRenderer.invoke("promotion:refresh"),
    onStatus: (cb: (status: unknown) => void) => {
      const handler = (_: unknown, status: unknown) => cb(status);
      ipcRenderer.on("promotion:event", handler);
      return () => ipcRenderer.removeListener("promotion:event", handler);
    },
  },

  auth: {
    listMethods: () => ipcRenderer.invoke("user-auth:methods"),
    start: (req: { methodId: string; payload?: Record<string, unknown> }) =>
      ipcRenderer.invoke("user-auth:start", req),
    verify: (req: {
      methodId: string;
      challengeId: string;
      payload: Record<string, unknown>;
    }) => ipcRenderer.invoke("user-auth:verify", req),
    status: () => ipcRenderer.invoke("user-auth:status"),
    touch: () => ipcRenderer.invoke("user-auth:touch"),
    logout: () => ipcRenderer.invoke("user-auth:logout"),
  },

  payment: {
    createQpayInvoice: (req: {
      paymentMethod: "qpay" | "qrcode";
      serviceId?: number;
      registerNumber?: string;
      amount?: number;
      metadata?: Record<string, unknown>;
    }) => ipcRenderer.invoke("payment:qpay:create", req),
    checkQpayInvoice: (req: {
      paymentMethod: "qpay" | "qrcode";
      invoiceId: string;
    }) => ipcRenderer.invoke("payment:qpay:check", req),
  },

  platform: {
    isElectron: true,
    platform: process.platform,
    version: process.versions.electron,
  },
};

contextBridge.exposeInMainWorld("electron", api);
