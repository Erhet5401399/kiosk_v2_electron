import { ipcMain } from "electron";
import { IPC, asList } from "../core";
import { logger, serviceApi } from "../services";
import type { GetDocumentRequest } from "../services/service";
import { ipcWrap } from "./result";

const log = logger.child("IPC:Service");

export function setupServiceHandlers() {
  ipcMain.handle(IPC.SERVICE_GET_DOCUMENT, async (_, request: GetDocumentRequest) => {
    return ipcWrap(() => serviceApi.getDocument(request), "Document fetch failed");
  });

  ipcMain.handle(IPC.CATEGORY_LIST, async () => {
      return ipcWrap(async () => {
        const data = await serviceApi.getCategories();
        return asList(data);
      }, "Get categories failed");
    });

  ipcMain.handle(IPC.PARCEL_LIST, async (_, register: string) => {
      return ipcWrap(async () => {
        const data = await serviceApi.getParcels(register);
        return asList(data);
      }, "Get parcels failed");
    });

  ipcMain.handle(IPC.PARCEL_REQUEST_LIST, async (_, register: string) => {
      return ipcWrap(async () => {
        const data = await serviceApi.getParcelRequests(register);
        return asList(data);
      }, "Get parcel requests failed");
    });
  
  ipcMain.handle(IPC.PARCEL_APPLICATION_LIST, async (_, register: string) => {
      return ipcWrap(async () => {
        const data = await serviceApi.getParcelApplications(register);
        return asList(data);
      }, "Get parcel applications failed");
    });

  ipcMain.handle(IPC.PARCEL_FEE_LIST, async (_, register: string) => {
      return ipcWrap(async () => {
        const data = await serviceApi.getParcelFees(register);
        return asList(data);
      }, "Get parcel fees failed");
    });

  log.info("Service IPC handlers registered");
}

export function cleanupServiceHandlers() {
  ipcMain.removeHandler(IPC.SERVICE_GET_DOCUMENT);
  ipcMain.removeHandler(IPC.CATEGORY_LIST);
  ipcMain.removeHandler(IPC.PARCEL_LIST);
}
