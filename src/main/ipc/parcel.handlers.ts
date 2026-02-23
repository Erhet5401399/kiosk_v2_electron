import { ipcMain } from 'electron';
import { IPC } from '../core/constants';
import { logger, parcel } from '../services';

const log = logger.child('IPC:Parcel');
const asList = <T>(payload: unknown): T[] =>
  Array.isArray(payload)
    ? payload as T[]
    : Array.isArray((payload as { data?: unknown[] } | null)?.data)
      ? ((payload as { data: T[] }).data)
      : [];

export function setupParcelHandlers() {

  ipcMain.handle(IPC.PARCEL_LIST, async (_, register: string) => {
    try {
      const data = await parcel.getParcels(register);
      return asList(data);
    } catch (e) {
      log.error('Get parcels failed:', e as Error);
      return [];
    }
  });

  ipcMain.handle(IPC.CATEGORY_LIST, async () => {
    try {
      const data = await parcel.getCategories();
      return asList(data);
    } catch (e) {
      log.error('Get categories failed:', e as Error);
      return [];
    }
  });

  log.info('Parcel IPC handlers registered');
}

export function cleanupParcelHandlers() {
  ipcMain.removeHandler(IPC.PARCEL_LIST);
  ipcMain.removeHandler(IPC.CATEGORY_LIST);
}
