import { contextBridge, ipcRenderer } from "electron";

type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function isIpcResult(value: unknown): value is IpcResult<unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { ok?: unknown }).ok === "boolean",
  );
}

async function invokeIpc<T>(channel: string, ...args: unknown[]): Promise<T> {
  const payload = await ipcRenderer.invoke(channel, ...args);
  if (!isIpcResult(payload)) {
    return payload as T;
  }

  if (payload.ok) {
    return payload.data as T;
  }

  throw new Error(String(payload.error || "Request failed"));
}

const api = {
  runtime: {
    getSnapshot: () => invokeIpc("runtime:snapshot"),
    onUpdate: (cb: (snap: unknown) => void) => {
      const handler = (_: unknown, snap: unknown) => cb(snap);
      ipcRenderer.on("runtime:update", handler);
      return () => ipcRenderer.removeListener("runtime:update", handler);
    },
    retry: () => invokeIpc("runtime:retry"),
    reset: () => invokeIpc("runtime:reset"),
  },

  config: {
    get: () => invokeIpc("config:get"),
    refresh: () => invokeIpc("config:refresh"),
  },

  printer: {
    print: (req: {
      content: string;
      type?: string;
      copies?: number;
      priority?: string;
    }) => invokeIpc("hardware:print", req),
    list: () => invokeIpc("hardware:printers"),
    getJobStatus: (jobId: string) =>
      invokeIpc("hardware:print-job-status", jobId),
    onJobStatus: (cb: (status: unknown) => void) => {
      const handler = (_: unknown, status: unknown) => cb(status);
      ipcRenderer.on("hardware:print:event", handler);
      return () => ipcRenderer.removeListener("hardware:print:event", handler);
    },
  },

  health: {
    getStatus: () => invokeIpc("health:status"),
  },

  updater: {
    getStatus: () => invokeIpc("update:status"),
    check: () => invokeIpc("update:check"),
    install: () => invokeIpc("update:install"),
    onStatus: (cb: (status: unknown) => void) => {
      const handler = (_: unknown, status: unknown) => cb(status);
      ipcRenderer.on("update:event", handler);
      return () => ipcRenderer.removeListener("update:event", handler);
    },
  },

  parcel: {
    list: (register: string) => invokeIpc("parcel:list", register),
    requestList: (register: string) => invokeIpc("parcel:request:list", register),
    applicationList: (register: string) => invokeIpc("parcel:application:list", register),
    feeList: (parcelId: string) => invokeIpc("parcel:fee:list", parcelId),
    onlineRequestList: (register: string, parcelId: string) => invokeIpc("parcel:online-request:list", register, parcelId),
    onlineRequestForm: (register: string, parcelId: string, appType: string, value?: string) => invokeIpc("parcel:online-request:form", register, parcelId, appType, value),
    categories: () => invokeIpc("category:list"),
  },

  service: {
    getDocument: (request: {
      endpoint: string;
      method?: "GET" | "POST";
      params?: Record<string, unknown>;
    }) => invokeIpc("service:get-document", request),
  },

  promotion: {
    list: () => invokeIpc("promotion:list"),
    refresh: () => invokeIpc("promotion:refresh"),
    onStatus: (cb: (status: unknown) => void) => {
      const handler = (_: unknown, status: unknown) => cb(status);
      ipcRenderer.on("promotion:event", handler);
      return () => ipcRenderer.removeListener("promotion:event", handler);
    },
  },

  auth: {
    listMethods: () => invokeIpc("user-auth:methods"),
    start: (req: { methodId: string; payload?: Record<string, unknown> }) =>
      invokeIpc("user-auth:start", req),
    verify: (req: {
      methodId: string;
      challengeId: string;
      payload: Record<string, unknown>;
    }) => invokeIpc("user-auth:verify", req),
    status: () => invokeIpc("user-auth:status"),
    touch: () => invokeIpc("user-auth:touch"),
    logout: () => invokeIpc("user-auth:logout"),
  },

  payment: {
    createQpayInvoice: (req: {
      paymentMethod: "qpay" | "qrcode";
      serviceId?: number;
      registerNumber?: string;
      amount?: number;
      metadata?: Record<string, unknown>;
    }) => invokeIpc("payment:qpay:create", req),
    checkQpayInvoice: (req: {
      paymentMethod: "qpay" | "qrcode";
      invoiceId: string;
    }) => invokeIpc("payment:qpay:check", req),
  },

  platform: {
    isElectron: true,
    platform: process.platform,
    version: process.versions.electron,
  },
};

contextBridge.exposeInMainWorld("electron", api);
