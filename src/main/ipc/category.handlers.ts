import { ipcMain } from "electron";
import { IPC } from "../core/constants";
import { logger, parcel } from "../services";

const log = logger.child("IPC:Category");
const asList = <T>(payload: unknown): T[] =>
  Array.isArray(payload)
    ? (payload as T[])
    : Array.isArray((payload as { data?: unknown[] } | null)?.data)
      ? ((payload as { data: T[] }).data)
      : [];

export function setupCategoryHandlers() {
  ipcMain.handle(IPC.CATEGORY_LIST, async () => {
    try {
      const data = await parcel.getCategories();
      return asList(data);
    } catch (error) {
      log.error("Get categories failed", error as Error);
      return [];
    }
  });

  log.info("Category IPC handlers registered");
}

export function cleanupCategoryHandlers() {
  ipcMain.removeHandler(IPC.CATEGORY_LIST);
}
