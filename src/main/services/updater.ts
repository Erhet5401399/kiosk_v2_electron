import { EventEmitter } from "events";
import { app } from "electron";
import { autoUpdater, type AppUpdater } from "electron-updater";
import { UpdateStatus } from "../../shared/types";
import { UPDATER } from "../core/constants";
import { logger } from "./logger";

const FORCE_UPDATES_IN_DEV = process.env.FORCE_UPDATES_IN_DEV === "true";
const AUTO_INSTALL_ON_DOWNLOAD =
  process.env.AUTO_INSTALL_ON_DOWNLOAD !== "false";

class UpdaterService extends EventEmitter {
  private static inst: UpdaterService;
  private log = logger.child("Updater");
  private updater: AppUpdater | null = null;
  private checkTimer: NodeJS.Timeout | null = null;
  private installTimer: NodeJS.Timeout | null = null;
  private checking = false;
  private started = false;
  private status: UpdateStatus = {
    state: "idle",
    currentVersion: app.getVersion(),
  };

  static get(): UpdaterService {
    return this.inst || (this.inst = new UpdaterService());
  }

  getStatus(): UpdateStatus {
    return { ...this.status };
  }

  async start() {
    if (this.started) return;
    this.started = true;

    if (!app.isPackaged && !FORCE_UPDATES_IN_DEV) {
      this.log.info("Auto updates disabled in development");
      return;
    }

    this.updater = autoUpdater;
    this.updater.autoDownload = true;
    this.updater.autoInstallOnAppQuit = false;
    this.bindUpdaterEvents(this.updater);

    this.scheduleChecks();
    setTimeout(() => this.checkForUpdates(), UPDATER.START_DELAY_MS);
  }

  async checkForUpdates(): Promise<UpdateStatus> {
    if (this.checking) return this.getStatus();
    this.checking = true;
    this.updateStatus({
      state: "checking",
      error: undefined,
      lastCheckedAt: Date.now(),
    });

    try {
      if (!this.updater) return this.getStatus();
      await this.updater.checkForUpdates();
      return this.getStatus();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.log.error("Update check failed", e as Error);
      this.updateStatus({ state: "error", error: message });
      return this.getStatus();
    } finally {
      this.checking = false;
    }
  }

  async installNow(): Promise<boolean> {
    if (this.status.state !== "downloaded") return false;

    this.updateStatus({ state: "installing" });
    this.log.info("Installing downloaded update");

    if (!this.updater) return false;
    setImmediate(() => this.updater?.quitAndInstall(false, true));
    return true;
  }

  destroy() {
    if (this.checkTimer) clearInterval(this.checkTimer);
    if (this.installTimer) clearInterval(this.installTimer);
    this.removeAllListeners();
    this.started = false;
  }

  private bindUpdaterEvents(updater: AppUpdater) {
    updater.on("checking-for-update", () => {
      this.updateStatus({
        state: "checking",
        lastCheckedAt: Date.now(),
        error: undefined,
      });
    });

    updater.on("update-available", (info) => {
      this.updateStatus({
        state: "available",
        availableVersion: info.version,
        percent: 0,
      });
    });

    updater.on("update-not-available", () => {
      this.updateStatus({
        state: "up_to_date",
        availableVersion: undefined,
        percent: 100,
      });
    });

    updater.on("download-progress", (progress) => {
      this.updateStatus({
        state: "downloading",
        downloadedBytes: progress.transferred,
        totalBytes: progress.total,
        percent: progress.percent,
      });
    });

    updater.on("update-downloaded", (info) => {
      this.updateStatus({
        state: "downloaded",
        availableVersion: info.version,
        percent: 100,
      });

      this.maybeInstallByPolicy();
    });

    updater.on("error", (err) => {
      this.log.error("Updater error", err);
      this.updateStatus({ state: "error", error: err.message });
    });
  }

  private maybeInstallByPolicy() {
    if (!AUTO_INSTALL_ON_DOWNLOAD) return;
    if (this.installTimer) clearInterval(this.installTimer);

    const tryInstall = async () => {
      if (this.status.state !== "downloaded") return;

      const installed = await this.installNow();
      if (installed && this.installTimer) {
        clearInterval(this.installTimer);
        this.installTimer = null;
      }
    };

    void tryInstall();
    this.installTimer = setInterval(() => void tryInstall(), 60_000);
  }

  private scheduleChecks() {
    if (this.checkTimer) clearInterval(this.checkTimer);
    this.checkTimer = setInterval(
      () => void this.checkForUpdates(),
      UPDATER.CHECK_INTERVAL_MS,
    );
  }

  private updateStatus(patch: Partial<UpdateStatus>) {
    this.status = { ...this.status, ...patch };
    this.emit("status", this.getStatus());
  }
}

export const updater = UpdaterService.get();
