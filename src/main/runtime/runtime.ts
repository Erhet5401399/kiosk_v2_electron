import { EventEmitter } from "events";
import { RuntimeState, RuntimeSnapshot } from "../../shared/types";
import { STORAGE, RUNTIME } from "../core/constants";
import { toAppError } from "../core/errors";
import { debounce } from "../core/utils";
import { canTransition } from "./states";
import { storage, logger, device, deviceStore, config, api } from "../services";

class DeviceRuntime extends EventEmitter {
  private static inst: DeviceRuntime;
  private snapshot: RuntimeSnapshot;
  private healthTimer: NodeJS.Timeout | null = null;
  private shuttingDown = false;
  private log = logger.child("Runtime");
  private persist: () => void;
  private forceClearTokens = ["1", "true", "on", "yes"].includes(
    String(process.env.CLEAR_DEVICE_TOKENS ?? "false").trim().toLowerCase(),
  );

  private constructor() {
    super();
    const saved = storage.read<Partial<RuntimeSnapshot>>(
      STORAGE.STATE_FILE,
      {},
      false,
    );
    this.snapshot = {
      state: "initializing",
      retryCount: saved.retryCount || 0,
      uptime: 0,
      startedAt: Date.now(),
      deviceId: saved.deviceId,
    };
    if (this.forceClearTokens) {
      deviceStore.clearTokens();
      api.setToken(null);
      this.log.warn("Device tokens cleared", {
        reason: "CLEAR_DEVICE_TOKENS",
      });
    }
    this.persist = debounce(() => this.save(), RUNTIME.PERSIST_DEBOUNCE);
  }

  static get(): DeviceRuntime {
    return this.inst || (this.inst = new DeviceRuntime());
  }

  private save() {
    storage.write(
      STORAGE.STATE_FILE,
      {
        deviceId: this.snapshot.deviceId,
        retryCount: this.snapshot.retryCount,
      },
      false,
    );
  }

  private transition(
    to: RuntimeState,
    error?: string,
    errorMsg?: string,
  ): boolean {
    const from = this.snapshot.state;
    if (from === to) return true;

    if (!canTransition(from, to)) {
      this.log.warn(`Invalid transition: ${from} -> ${to}`);
      return false;
    }

    this.snapshot = {
      ...this.snapshot,
      state: to,
      error: to === "error" ? error : undefined,
      errorMessage: to === "error" ? errorMsg : undefined,
      retryCount:
        to === "error"
          ? this.snapshot.retryCount + 1
          : to === "ready"
            ? 0
            : this.snapshot.retryCount,
      uptime: Date.now() - this.snapshot.startedAt,
    };

    this.log.info(`${from} -> ${to}`, error ? { error } : undefined);
    this.persist();
    this.emit("state-change", this.getSnapshot());
    return true;
  }

  async start() {
    if (this.shuttingDown) return;
    this.log.info("Starting runtime");
    this.transition("booting");

    try {
      this.snapshot.deviceId = deviceStore.getDeviceId();

      if (!deviceStore.isRegistered()) {
        this.transition("unregistered");
        this.transition("registering");
        device.startPolling(() => this.authenticate());
        return;
      }

      await this.authenticate();
    } catch (e) {
      this.handleError(e);
    }
  }

  private async authenticate() {
    this.transition("authenticating");
    try {
      await device.authenticate();
      await this.loadConfig();
    } catch (e) {
      this.handleError(e);
    }
  }

  private async loadConfig() {
    this.transition("loading_config");
    try {
      await config.fetch();
      this.transition("ready");
      this.emit("ready", this.getSnapshot());
      this.startHealthChecks();
    } catch (e) {
      this.handleError(e);
    }
  }

  private handleError(e: unknown) {
    const err = toAppError(e);
    this.log.error("Runtime error", err);
    this.transition("error", err.code, err.message);
    this.emit("error", err);

    if (err.retryable && this.snapshot.retryCount < 5) {
      const delay = Math.min(
        5000 * Math.pow(2, this.snapshot.retryCount),
        60000,
      );
      this.log.info(`Retry in ${delay}ms`);
      setTimeout(() => !this.shuttingDown && this.retry(), delay);
    }
  }

  private startHealthChecks() {
    this.stopHealthChecks();
    this.healthTimer = setInterval(async () => {
      const ok = await api.healthCheck();
      if (!ok && this.snapshot.state === "ready") this.transition("offline");
      else if (ok && this.snapshot.state === "offline") {
        this.transition("ready");
        this.emit("ready", this.getSnapshot());
      }
    }, RUNTIME.HEALTH_CHECK);
  }

  private stopHealthChecks() {
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
  }

  async retry() {
    if (this.snapshot.state !== "error") return;
    this.log.info("Retrying...");
    await this.start();
  }

  async reset() {
    this.log.warn("Resetting device");
    this.stopHealthChecks();
    device.stopPolling();
    deviceStore.reset();
    api.setToken(null);
    this.snapshot = {
      state: "initializing",
      retryCount: 0,
      uptime: 0,
      startedAt: Date.now(),
    };
    storage.delete(STORAGE.STATE_FILE);
    await this.start();
  }

  async shutdown() {
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    this.log.info("Shutting down");
    this.transition("shutting_down");
    this.stopHealthChecks();
    device.destroy();
    config.destroy();
    this.save();
    this.emit("shutdown");
    this.removeAllListeners();
  }

  getSnapshot(): RuntimeSnapshot {
    return { ...this.snapshot, uptime: Date.now() - this.snapshot.startedAt };
  }

  getState() {
    return this.snapshot.state;
  }
  isReady() {
    return this.snapshot.state === "ready";
  }
  isError() {
    return this.snapshot.state === "error";
  }
}

export const runtime = DeviceRuntime.get();
