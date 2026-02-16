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
      return (
        unwrapData<CheckQpayInvoiceResponse>(data) ?? {
          paid: false,
          status: "UNKNOWN",
        }
      );
    } catch (e) {
      log.error("Check QPay invoice failed:", e as Error);
      return {
        paid: false,
        status: "ERROR",
      } satisfies CheckQpayInvoiceResponse;
    }
  });

  log.info("Payment IPC handlers registered");
}

export function cleanupPaymentHandlers() {
  ipcMain.removeHandler(IPC.PAYMENT_QPAY_CREATE);
  ipcMain.removeHandler(IPC.PAYMENT_QPAY_CHECK);
}
