import crypto from "crypto";
import os from "os";
import { EventEmitter } from "events";
import { TokenPayload, DeviceInfo } from "../../shared/types";
import { STORAGE, AUTH, RUNTIME } from "../core/constants";
import { storage } from "./storage";
import { api } from "./api";
import { logger } from "./logger";

type DeviceData = { device: DeviceInfo; tokens?: TokenPayload } | null;

class DeviceStore {
  private data: DeviceData = null;
  private log = logger.child("DeviceStore");

  load() {
    if (this.data) return this.data;

    const stored = storage.read<DeviceData>(STORAGE.DEVICE_FILE, null);
    if (stored?.device?.deviceId) {
      this.data = stored;
    } else {
      this.data = {
        device: {
          deviceId: crypto.randomUUID(),
          hardwareId: crypto
            .createHash("sha256")
            .update(
              [
                os.hostname(),
                os.platform(),
                os.arch(),
                os.cpus()[0]?.model,
              ].join("|"),
            )
            .digest("hex")
            .slice(0, 32),
          hostname: os.hostname(),
          platform: os.platform(),
          registeredAt: Date.now(),
        },
      };
      this.save();
      this.log.info("Created new device", {
        id: this.data.device.deviceId.slice(0, 8),
      });
    }
    return this.data;
  }

  private save() {
    if (this.data) storage.write(STORAGE.DEVICE_FILE, this.data);
  }

  getDeviceId() {
    return this.load().device.deviceId;
  }
  getInfo() {
    return this.load().device;
  }
  getTokens() {
    return this.load().tokens || null;
  }
  isRegistered() {
    return !!this.getTokens()?.accessToken;
  }

  setTokens(tokens: TokenPayload) {
    this.load();
    if (this.data) {
      this.data.tokens = { ...tokens, issuedAt: Date.now() };
      this.save();
    }
  }

  clearTokens() {
    if (this.data) {
      this.data.tokens = undefined;
      this.save();
    }
  }

  isTokenExpired() {
    const t = this.getTokens();
    return (
      !t?.expiresAt || Date.now() >= t.expiresAt - AUTH.TOKEN_REFRESH_THRESHOLD
    );
  }

  reset() {
    storage.delete(STORAGE.DEVICE_FILE);
    this.data = null;
  }
}

export const deviceStore = new DeviceStore();

class DeviceService extends EventEmitter {
  private static inst: DeviceService;
  private pollTimer: NodeJS.Timeout | null = null;
  private log = logger.child("Device");

  static get(): DeviceService {
    return this.inst || (this.inst = new DeviceService());
  }

  async register(): Promise<boolean> {
    if (deviceStore.isRegistered()) return true;

    try {
      this.log.info("Registering device");
      const res = await api.post<{ tokens?: TokenPayload }>(
        "/device/register",
        {
          deviceId: deviceStore.getDeviceId(),
          hardwareId: deviceStore.getInfo().hardwareId,
          platform: process.platform,
        },
      );

      if (res.tokens) {
        deviceStore.setTokens(res.tokens);
        api.setToken(res.tokens.accessToken);
        this.emit("registered");
        this.log.info("Registered");
        return true;
      }
      return false;
    } catch (e) {
      this.log.error("Registration failed", e as Error);
      return false;
    }
  }

  startPolling(onSuccess: () => void) {
    if (this.pollTimer) return;
    this.log.info("Starting registration polling");

    const poll = async () => {
      if (await this.register()) {
        this.stopPolling();
        onSuccess();
      }
    };

    poll();
    this.pollTimer = setInterval(poll, RUNTIME.REGISTRATION_POLL);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async authenticate(): Promise<TokenPayload> {
    const tokens = deviceStore.getTokens();

    if (tokens && !deviceStore.isTokenExpired()) {
      api.setToken(tokens.accessToken);
      return tokens;
    }

    if (tokens?.refreshToken) {
      try {
        const res = await api.post<TokenPayload>("/auth/refresh", {
          refreshToken: tokens.refreshToken,
          deviceId: deviceStore.getDeviceId(),
        });
        deviceStore.setTokens(res);
        api.setToken(res.accessToken);
        return res;
      } catch {
        deviceStore.clearTokens();
      }
    }

    const res = await api.post<TokenPayload>("/auth/device-login", {
      deviceId: deviceStore.getDeviceId(),
    });
    deviceStore.setTokens(res);
    api.setToken(res.accessToken);
    return res;
  }

  destroy() {
    this.stopPolling();
    this.removeAllListeners();
  }
}

export const device = DeviceService.get();
