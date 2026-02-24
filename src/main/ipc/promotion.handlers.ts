import { ipcMain } from "electron";
import { IPC } from "../core/constants";
import { logger, promotion } from "../services";

const log = logger.child("IPC:Promotion");

export function setupPromotionHandlers() {
  ipcMain.handle(IPC.PROMOTION_LIST, async () => {
    return promotion.list();
  });

  ipcMain.handle(IPC.PROMOTION_REFRESH, async () => {
    return promotion.refresh();
  });

  log.info("Promotion IPC handlers registered");
}

export function cleanupPromotionHandlers() {
  ipcMain.removeHandler(IPC.PROMOTION_LIST);
  ipcMain.removeHandler(IPC.PROMOTION_REFRESH);
}
