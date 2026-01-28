import { ipcMain } from 'electron';
import { IPC } from '../core/constants';
import { logger, parcel } from '../services';

const log = logger.child('IPC:Parcel');

export function setupParcelHandlers() {

  ipcMain.handle(IPC.PARCEL_LIST, async (_, register: string) => {
    try {
      const data = await parcel.getParcels(register);
      return data;
    } catch (e) {
      log.error('Get parcels failed:', e as Error);
      return { success: false, error: (e as Error).message };
    }
  });

  log.info('Parcel IPC handlers registered');
}

export function cleanupParcelHandlers() {
  ipcMain.removeHandler(IPC.PARCEL_LIST);
}
