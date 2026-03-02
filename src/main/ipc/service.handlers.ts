import { ipcMain } from "electron";
import { IPC, asList } from "../core";
import { logger, serviceApi } from "../services";
import type { GetDocumentRequest } from "../services/service";

const log = logger.child("IPC:Service");

export function setupServiceHandlers() {
  ipcMain.handle(IPC.SERVICE_GET_DOCUMENT, async (_, request: GetDocumentRequest) => {
    return serviceApi.getDocument(request);
  });

  ipcMain.handle(IPC.CATEGORY_LIST, async () => {
      try {
        const data = await serviceApi.getCategories();
        return asList(data);
      } catch (error) {
        log.error("Get categories failed", error as Error);
        return [];
      }
    });

  ipcMain.handle(IPC.PARCEL_LIST, async (_, register: string) => {
      try {
        const data = await serviceApi.getParcels(register);
        return asList(data);
      } catch (e) {
        log.error('Get parcels failed:', e as Error);
        return [];
      }
    });

  ipcMain.handle(IPC.PARCEL_REQUEST_LIST, async (_, register: string) => {
      try {
        const data = await serviceApi.getParcelRequests(register);
        return asList(data);
      } catch (e) {
        log.error('Get parcel requests failed:', e as Error);
        return [];
      }
    });
  
  ipcMain.handle(IPC.PARCEL_APPLICATION_LIST, async (_, register: string) => {
      try {
        const data = await serviceApi.getParcelApplications(register);
        return asList(data);
      } catch (e) {
        log.error('Get parcel applications failed:', e as Error);
        return [];
      }
    });

  log.info("Service IPC handlers registered");
}

export function cleanupServiceHandlers() {
  ipcMain.removeHandler(IPC.SERVICE_GET_DOCUMENT);
  ipcMain.removeHandler(IPC.CATEGORY_LIST);
  ipcMain.removeHandler(IPC.PARCEL_LIST);
}
