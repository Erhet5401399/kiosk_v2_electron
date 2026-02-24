import { ipcMain } from "electron";
import { IPC } from "../core/constants";
import { logger, serviceApi } from "../services";

const log = logger.child("IPC:Service");

export function setupServiceHandlers() {
  ipcMain.handle(IPC.SERVICE_FREE_LAND_OWNER_REFERENCE, async (_, register: string) => {
    return serviceApi.getFreeLandOwnerReference(register);
  });

  log.info("Service IPC handlers registered");
}

export function cleanupServiceHandlers() {
  ipcMain.removeHandler(IPC.SERVICE_FREE_LAND_OWNER_REFERENCE);
}
