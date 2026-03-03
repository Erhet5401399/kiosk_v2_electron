import { ipcMain } from 'electron';
import { IPC } from '../core/constants';
import { runtime } from '../runtime';
import { config, printer, logger, promotion, updater, userAuth } from '../services';
import { windows } from '../windows/manager';
import { cleanupPaymentHandlers, setupPaymentHandlers } from './payment.handlers';
import { cleanupPromotionHandlers, setupPromotionHandlers } from './promotion.handlers';
import { cleanupServiceHandlers, setupServiceHandlers } from './service.handlers';
import { ipcWrap } from './result';
import type { PrintJobStatus, PromotionEvent, UserAuthStartRequest, UserAuthVerifyRequest } from '../../shared/types';

const log = logger.child('IPC');
const updaterStatusHandler = (status: unknown) => {
  windows.broadcast(IPC.UPDATE_EVENT, status);
};
const promotionStateHandler = (event: PromotionEvent) => {
  windows.broadcast(IPC.PROMOTION_EVENT, event);
};
const printerStatusHandler = (event: PrintJobStatus) => {
  windows.broadcast(IPC.PRINT_EVENT, event);
};

export function setupIPC() {
  ipcMain.handle(IPC.RUNTIME_SNAPSHOT, () => ipcWrap(() => runtime.getSnapshot()));
  ipcMain.handle(IPC.RUNTIME_RETRY, () => ipcWrap(() => runtime.retry()));
  ipcMain.handle(IPC.RUNTIME_RESET, () => ipcWrap(() => runtime.reset()));

  ipcMain.handle(IPC.PRINT, async (_, req: { content: string; type?: 'html' | 'text' | 'pdf' | 'pdf_base64'; copies?: number; priority?: 'low' | 'normal' | 'high' }) => {
    return ipcWrap(async () => {
      const jobId = await printer.print(req.content, req.type, { copies: req.copies, priority: req.priority });
      return { success: true, jobId };
    }, "Print failed");
  });

  ipcMain.handle(IPC.PRINTERS, () => ipcWrap(() => printer.list()));
  ipcMain.handle(IPC.PRINT_JOB_STATUS, (_, jobId: string) => ipcWrap(() => printer.getJobStatus(jobId)));
  ipcMain.handle(IPC.CONFIG_GET, () => ipcWrap(() => config.get()));
  ipcMain.handle(IPC.CONFIG_REFRESH, () => ipcWrap(() => config.fetch()));
  ipcMain.handle(IPC.UPDATE_STATUS, () => ipcWrap(() => updater.getStatus()));
  ipcMain.handle(IPC.UPDATE_CHECK, () => ipcWrap(() => updater.checkForUpdates()));
  ipcMain.handle(IPC.UPDATE_INSTALL, () => ipcWrap(() => updater.installNow()));
  ipcMain.handle(IPC.USER_AUTH_METHODS, () => ipcWrap(() => userAuth.listMethods()));
  ipcMain.handle(IPC.USER_AUTH_START, (_, req: UserAuthStartRequest | string) => ipcWrap(() => userAuth.start(req)));
  ipcMain.handle(IPC.USER_AUTH_VERIFY, (_, req: UserAuthVerifyRequest) =>
    ipcWrap(() => userAuth.verify(req)),
  );
  ipcMain.handle(IPC.USER_AUTH_STATUS, () => ipcWrap(() => userAuth.getStatus()));
  ipcMain.handle(IPC.USER_AUTH_TOUCH, () => ipcWrap(() => userAuth.touch()));
  ipcMain.handle(IPC.USER_AUTH_LOGOUT, () => ipcWrap(() => userAuth.logout()));

  ipcMain.handle(IPC.HEALTH, () => ipcWrap(() => ({
    online: runtime.isReady(),
    lastCheck: Date.now(),
    services: { api: runtime.isReady(), printer: printer.isReady(), storage: true },
    metrics: {
      uptime: runtime.getSnapshot().uptime,
      memoryUsage: process.memoryUsage().heapUsed,
    },
  })));

  setupServiceHandlers();
  setupPaymentHandlers();
  setupPromotionHandlers();

  runtime.on('state-change', (snapshot) => {
    windows.broadcast(IPC.RUNTIME_UPDATE, snapshot);
  });
  updater.on('status', updaterStatusHandler);
  promotion.on('state', promotionStateHandler);
  printer.on('job-status', printerStatusHandler);

  log.info('IPC handlers registered');
}

export function cleanupIPC() {
  cleanupServiceHandlers();
  cleanupPaymentHandlers();
  cleanupPromotionHandlers();
  ipcMain.removeHandler(IPC.RUNTIME_SNAPSHOT);
  ipcMain.removeHandler(IPC.RUNTIME_RETRY);
  ipcMain.removeHandler(IPC.RUNTIME_RESET);
  ipcMain.removeHandler(IPC.PRINT);
  ipcMain.removeHandler(IPC.PRINTERS);
  ipcMain.removeHandler(IPC.PRINT_JOB_STATUS);
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
  promotion.removeListener('state', promotionStateHandler);
  printer.removeListener('job-status', printerStatusHandler);
}
