import "./env";
import { app, dialog, net, protocol } from "electron";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { setupIPC, cleanupIPC } from "./ipc/handlers";
import { runtime } from "./runtime";
import { windows } from "./windows/manager";
import { logger, promotion, updater } from "./services";
import { APP } from "./core/constants";

const log = logger.child("Main");
let quitting = false;
const PROMOTION_CACHE_DIR = "promotion-videos";
const MEDIA_SCHEME = "kiosk-media";

protocol.registerSchemesAsPrivileged([
  {
    scheme: MEDIA_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function resolvePromotionMediaPath(requestUrl: string): string {
  const parsed = new URL(requestUrl);
  const fileName = decodeURIComponent(path.basename(parsed.pathname || ""));
  if (!fileName) {
    throw new Error("Missing promotion media filename");
  }

  const cacheDir = path.join(app.getPath("userData"), PROMOTION_CACHE_DIR);
  const targetPath = path.join(cacheDir, fileName);
  const normalizedCacheDir = path.resolve(cacheDir);
  const normalizedTarget = path.resolve(targetPath);
  if (!normalizedTarget.startsWith(normalizedCacheDir)) {
    throw new Error("Invalid promotion media path");
  }
  return normalizedTarget;
}

function setupMediaProtocol() {
  protocol.handle(MEDIA_SCHEME, async (request) => {
    try {
      const targetPath = resolvePromotionMediaPath(request.url);
      await fs.access(targetPath);
      return net.fetch(pathToFileURL(targetPath).toString());
    } catch (error) {
      log.warn("Failed to serve local promotion media", {
        url: request.url,
        error: (error as Error).message,
      });
      return new Response("Not Found", { status: 404 });
    }
  });
}

function setupSecurity() {
  const safeOrigin = (value: string): string => {
    if (!value) return "";
    try {
      return new URL(value).origin;
    } catch {
      return "";
    }
  };

  const danAuthorizeUrl = String(process.env.DAN_AUTHORIZE_URL || "").trim();
  const danRedirectUri = String(process.env.DAN_REDIRECT_URI || "").trim();

  const danAuthorizeOrigin = safeOrigin(danAuthorizeUrl);
  const danRedirectOrigin = safeOrigin(danRedirectUri);

  app.on("web-contents-created", (_, contents) => {
    contents.on("will-attach-webview", (event, webPreferences, params) => {
      const src = String(params.src || "");
      const srcOrigin = src.startsWith("http") ? safeOrigin(src) : "";
      const allowed =
        src.startsWith("data:text/html") ||
        src.startsWith("https://sso.gov.mn/") ||
        src.startsWith("https://kiosk.local/auth/dan/") ||
        (!!danAuthorizeOrigin && srcOrigin === danAuthorizeOrigin) ||
        (!!danRedirectOrigin && srcOrigin === danRedirectOrigin);

      if (!allowed) {
        event.preventDefault();
        log.warn("Blocked webview source", { src });
        return;
      }

      webPreferences.nodeIntegration = false;
      webPreferences.contextIsolation = true;
      webPreferences.webSecurity = true;
      delete (webPreferences as { preload?: string }).preload;
      delete (webPreferences as { preloadURL?: string }).preloadURL;
    });
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
    promotion.destroy();
    updater.destroy();
    protocol.unhandle(MEDIA_SCHEME);
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
  setupMediaProtocol();
  setupCrashHandling();
  if (!setupSingleInstance()) return;

  app.setAppUserModelId(APP.PROTOCOL);
  setupIPC();

  runtime.on("state-change", (snap) => windows.sync(snap));
  runtime.on("shutdown", () => windows.closeAll());

  await runtime.start();
  await promotion.start();
  await updater.start();
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

