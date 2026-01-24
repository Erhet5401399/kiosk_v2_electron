import { app, dialog } from "electron";
import { setupIPC, cleanupIPC } from "./ipc/handlers";
import { runtime } from "./runtime";
import { windows } from "./windows/manager";
import { logger } from "./services";
import { APP } from "./core/constants";

const log = logger.child("Main");
let quitting = false;

function setupSecurity() {
  app.on("web-contents-created", (_, contents) => {
    contents.on("will-attach-webview", (e) => e.preventDefault());
    contents.setWindowOpenHandler(() => ({ action: "deny" }));
  });
}

function setupSingleInstance(): boolean {
  if (!app.requestSingleInstanceLock()) {
    log.warn("Another instance running");
    app.quit();
    return false;
  }

  app.on("second-instance", () => {
    const wins = windows.getAll();
    if (wins.length) {
      if (wins[0].isMinimized()) wins[0].restore();
      wins[0].focus();
    }
  });

  return true;
}

function setupCrashHandling() {
  process.on("uncaughtException", (err) => {
    log.fatal("Uncaught exception", err);
    if (!quitting) {
      dialog.showErrorBox("Error", `Unexpected error: ${err.message}`);
    }
    shutdown(1);
  });

  process.on("unhandledRejection", (reason) => {
    log.error(
      "Unhandled rejection",
      reason instanceof Error ? reason : new Error(String(reason)),
    );
  });

  app.on("render-process-gone", (_, contents, details) => {
    log.error("Renderer crashed", new Error(details.reason));
  });
}

async function shutdown(code = 0) {
  if (quitting) return;
  quitting = true;
  log.info("Shutting down");

  try {
    await runtime.shutdown();
    cleanupIPC();
    await logger.close();
  } catch {}

  app.exit(code);
}

async function init() {
  log.info(`Starting ${APP.NAME} v${APP.VERSION}`, {
    platform: process.platform,
    electron: process.versions.electron,
  });

  setupSecurity();
  setupCrashHandling();
  if (!setupSingleInstance()) return;

  app.setAppUserModelId(APP.PROTOCOL);
  setupIPC();

  runtime.on("state-change", (snap) => windows.sync(snap));
  runtime.on("shutdown", () => windows.closeAll());

  await runtime.start();
  log.info("Application ready");
}

app.on("ready", async () => {
  try {
    await init();
  } catch (e) {
    log.fatal("Init failed", e as Error);
    await shutdown(1);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") shutdown();
});

app.on("before-quit", (e) => {
  if (!quitting) {
    e.preventDefault();
    shutdown();
  }
});

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
