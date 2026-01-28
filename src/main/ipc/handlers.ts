import { ipcMain } from 'electron';
import { IPC } from '../core/constants';
import { runtime } from '../runtime';
import { config, printer, logger } from '../services';
import { windows } from '../windows/manager';
import { cleanupParcelHandlers, setupParcelHandlers } from './parcel.handlers';

const log = logger.child('IPC');

export function setupIPC() {
  ipcMain.handle(IPC.RUNTIME_SNAPSHOT, () => runtime.getSnapshot());
  ipcMain.handle(IPC.RUNTIME_RETRY, () => runtime.retry());
  ipcMain.handle(IPC.RUNTIME_RESET, () => runtime.reset());

  ipcMain.handle(IPC.PRINT, async (_, req: { content: string; type?: 'html' | 'text' | 'pdf'; copies?: number; priority?: 'low' | 'normal' | 'high' }) => {
    try {
      const jobId = await printer.print(req.content, req.type, { copies: req.copies, priority: req.priority });
      return { success: true, jobId };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  });

  ipcMain.handle(IPC.PRINTERS, () => printer.list());
  ipcMain.handle(IPC.CONFIG_GET, () => config.get());
  ipcMain.handle(IPC.CONFIG_REFRESH, () => config.fetch());

  ipcMain.handle(IPC.HEALTH, () => ({
    online: runtime.isReady(),
    lastCheck: Date.now(),
    services: { api: runtime.isReady(), printer: printer.isReady(), storage: true },
    metrics: {
      uptime: runtime.getSnapshot().uptime,
      memoryUsage: process.memoryUsage().heapUsed,
    },
  }));

  setupParcelHandlers();

  runtime.on('state-change', (snapshot) => {
    windows.broadcast(IPC.RUNTIME_UPDATE, snapshot);
  });

  log.info('IPC handlers registered');
}

export function cleanupIPC() {
  cleanupParcelHandlers();
  ipcMain.removeHandler(IPC.RUNTIME_SNAPSHOT);
  ipcMain.removeHandler(IPC.RUNTIME_RETRY);
  ipcMain.removeHandler(IPC.RUNTIME_RESET);
  ipcMain.removeHandler(IPC.PRINT);
  ipcMain.removeHandler(IPC.PRINTERS);
  ipcMain.removeHandler(IPC.CONFIG_GET);
  ipcMain.removeHandler(IPC.CONFIG_REFRESH);
  ipcMain.removeHandler(IPC.HEALTH);
}
