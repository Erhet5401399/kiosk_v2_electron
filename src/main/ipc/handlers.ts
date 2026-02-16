import { ipcMain } from 'electron';
import { IPC } from '../core/constants';
import { runtime } from '../runtime';
import { config, printer, logger, updater, userAuth } from '../services';
import { windows } from '../windows/manager';
import { cleanupParcelHandlers, setupParcelHandlers } from './parcel.handlers';
import { cleanupPaymentHandlers, setupPaymentHandlers } from './payment.handlers';
import type { UserAuthVerifyRequest } from '../../shared/types';

const log = logger.child('IPC');
const updaterStatusHandler = (status: unknown) => {
  windows.broadcast(IPC.UPDATE_EVENT, status);
};

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
  ipcMain.handle(IPC.UPDATE_STATUS, () => updater.getStatus());
  ipcMain.handle(IPC.UPDATE_CHECK, () => updater.checkForUpdates());
  ipcMain.handle(IPC.UPDATE_INSTALL, () => updater.installNow());
  ipcMain.handle(IPC.USER_AUTH_METHODS, () => userAuth.listMethods());
  ipcMain.handle(IPC.USER_AUTH_START, (_, methodId: string) => userAuth.start(methodId));
  ipcMain.handle(IPC.USER_AUTH_VERIFY, (_, req: UserAuthVerifyRequest) =>
    userAuth.verify(req),
  );
  ipcMain.handle(IPC.USER_AUTH_STATUS, () => userAuth.getStatus());
  ipcMain.handle(IPC.USER_AUTH_TOUCH, () => userAuth.touch());
  ipcMain.handle(IPC.USER_AUTH_LOGOUT, () => userAuth.logout());

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
  setupPaymentHandlers();

  runtime.on('state-change', (snapshot) => {
    windows.broadcast(IPC.RUNTIME_UPDATE, snapshot);
  });
  updater.on('status', updaterStatusHandler);

  log.info('IPC handlers registered');
}

export function cleanupIPC() {
  cleanupParcelHandlers();
  cleanupPaymentHandlers();
  ipcMain.removeHandler(IPC.RUNTIME_SNAPSHOT);
  ipcMain.removeHandler(IPC.RUNTIME_RETRY);
  ipcMain.removeHandler(IPC.RUNTIME_RESET);
  ipcMain.removeHandler(IPC.PRINT);
  ipcMain.removeHandler(IPC.PRINTERS);
  ipcMain.removeHandler(IPC.CONFIG_GET);
  ipcMain.removeHandler(IPC.CONFIG_REFRESH);
  ipcMain.removeHandler(IPC.UPDATE_STATUS);
  ipcMain.removeHandler(IPC.UPDATE_CHECK);
  ipcMain.removeHandler(IPC.UPDATE_INSTALL);
  ipcMain.removeHandler(IPC.USER_AUTH_METHODS);
  ipcMain.removeHandler(IPC.USER_AUTH_START);
  ipcMain.removeHandler(IPC.USER_AUTH_VERIFY);
  ipcMain.removeHandler(IPC.USER_AUTH_STATUS);
  ipcMain.removeHandler(IPC.USER_AUTH_TOUCH);
  ipcMain.removeHandler(IPC.USER_AUTH_LOGOUT);
  ipcMain.removeHandler(IPC.HEALTH);
  updater.removeListener('status', updaterStatusHandler);
}
