import { ipcMain } from "electron";
import { IPC } from "../core/constants";
import { logger, promotion } from "../services";
import { ipcWrap } from "./result";

const log = logger.child("IPC:Promotion");

export function setupPromotionHandlers() {
  ipcMain.handle(IPC.PROMOTION_LIST, async () => {
    return ipcWrap(() => promotion.list(), "Get promotion list failed");
  });

  ipcMain.handle(IPC.PROMOTION_REFRESH, async () => {
    return ipcWrap(() => promotion.refresh(), "Refresh promotion failed");
  });

  log.info("Promotion IPC handlers registered");
}

export function cleanupPromotionHandlers() {
  ipcMain.removeHandler(IPC.PROMOTION_LIST);
  ipcMain.removeHandler(IPC.PROMOTION_REFRESH);
}
