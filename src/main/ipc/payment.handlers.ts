import { ipcMain } from "electron";
import { IPC } from "../core/constants";
import { logger, payment } from "../services";
import type {
  CheckQpayInvoiceRequest,
  CheckQpayInvoiceResponse,
  CreateQpayInvoiceRequest,
  CreateQpayInvoiceResponse,
} from "../../shared/types";

const log = logger.child("IPC:Payment");

const unwrapData = <T>(payload: unknown): T | null => {
  if (!payload) return null;
  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    (payload as { data?: unknown }).data
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const normalizeCheckResponse = (payload: unknown): CheckQpayInvoiceResponse => {
  const asPaymentState = (value: unknown): string => {
    const normalized = String(value ?? "").trim().toUpperCase();
    if (!normalized) return "UNKNOWN";
    if (normalized === "SUCCESS") return "PAID";
    return normalized;
  };

  if (typeof payload === "string") {
    const data = asPaymentState(payload);
    return {
      data,
      status: true,
    };
  }

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (
      typeof obj.data === "string" &&
      typeof obj.status === "boolean"
    ) {
      return {
        data: asPaymentState(obj.data),
        status: obj.status,
      };
    }

    if (typeof obj.paid === "boolean") {
      return {
        data: obj.paid ? "PAID" : "UNPAID",
        status: true,
      };
    }

    if (typeof obj.status === "string") {
      return {
        data: asPaymentState(obj.status),
        status: true,
      };
    }

    return {
      data: "UNKNOWN",
      status: false,
    };
  }

  return {
    data: "UNKNOWN",
    status: false,
  };
};

export function setupPaymentHandlers() {
  ipcMain.handle(IPC.PAYMENT_QPAY_CREATE, async (_, req: CreateQpayInvoiceRequest) => {
    try {
      const data = await payment.createQpayInvoice(req);
      return unwrapData<CreateQpayInvoiceResponse>(data);
    } catch (e) {
      log.error("Create QPay invoice failed:", e as Error);
      return null;
    }
  });

  ipcMain.handle(IPC.PAYMENT_QPAY_CHECK, async (_, req: CheckQpayInvoiceRequest) => {
    try {
      const data = await payment.checkQpayInvoice(req);
      return normalizeCheckResponse(data);
    } catch (e) {
      log.error("Check QPay invoice failed:", e as Error);
      return {
        data: "ERROR",
        status: false,
      } satisfies CheckQpayInvoiceResponse;
    }
  });

  log.info("Payment IPC handlers registered");
}

export function cleanupPaymentHandlers() {
  ipcMain.removeHandler(IPC.PAYMENT_QPAY_CREATE);
  ipcMain.removeHandler(IPC.PAYMENT_QPAY_CHECK);
}
