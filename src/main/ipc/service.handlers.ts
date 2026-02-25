import { ipcMain } from "electron";
import { IPC } from "../core/constants";
import { logger, serviceApi } from "../services";
import type { GetDocumentRequest } from "../services/service";

const log = logger.child("IPC:Service");

export function setupServiceHandlers() {
  ipcMain.handle(IPC.SERVICE_GET_DOCUMENT, async (_, request: GetDocumentRequest) => {
    return serviceApi.getDocument(request);
  });

  log.info("Service IPC handlers registered");
}

export function cleanupServiceHandlers() {
  ipcMain.removeHandler(IPC.SERVICE_GET_DOCUMENT);
}
