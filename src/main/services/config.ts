import { EventEmitter } from "events";
import { DeviceConfig } from "../../shared/types";
import { RUNTIME } from "../core/constants";
import { api } from "./api";
import { device } from "./device";
import { logger } from "./logger";

const DEFAULT: DeviceConfig = {
  deviceName: "Kiosk Device",
  printerEnabled: true,
  kioskMode: true,
  refreshInterval: 60000,
  maintenanceMode: false,
};

class ConfigService extends EventEmitter {
  private static inst: ConfigService;
  private config: DeviceConfig = DEFAULT;
  private refreshTimer: NodeJS.Timeout | null = null;
  private log = logger.child("Config");

  static get(): ConfigService {
    return this.inst || (this.inst = new ConfigService());
  }

  async fetch(): Promise<DeviceConfig> {
    try {
      await device.authenticate();
      this.config = await api.get<DeviceConfig>("/device/config");
      this.emit("updated", this.config);
      this.log.info("Config loaded", { name: this.config.deviceName });
      this.scheduleRefresh();
      return this.config;
    } catch (e) {
      this.log.error("Config fetch failed", e as Error);
      return this.config;
    }
  }

  private scheduleRefresh() {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(
      () => this.fetch(),
      this.config.refreshInterval || RUNTIME.CONFIG_REFRESH,
    );
  }

  get(): DeviceConfig {
    return this.config;
  }
  isMaintenanceMode() {
    return this.config.maintenanceMode || false;
  }
  isPrinterEnabled() {
    return this.config.printerEnabled;
  }

  destroy() {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.removeAllListeners();
  }
}

export const config = ConfigService.get();
