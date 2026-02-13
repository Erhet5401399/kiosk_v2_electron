import { EventEmitter } from "events";
import { DeviceConfig } from "../../shared/types";
import { RUNTIME } from "../core/constants";
import { api } from "./api";
import { device } from "./device";
import { logger } from "./logger";

const DEFAULT: DeviceConfig = {
  device_name: "Kiosk Device",
  printer_enabled: true,
  kiosk_mode: true,
  refresh_interval: 60000,
  maintenance_mode: false,
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
      this.log.info("Config loaded", { name: this.config.device_name });
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
      this.config.refresh_interval || RUNTIME.CONFIG_REFRESH,
    );
  }

  get(): DeviceConfig {
    return this.config;
  }
  isMaintenanceMode() {
    return this.config.maintenance_mode || false;
  }
  isPrinterEnabled() {
    return this.config.printer_enabled;
  }

  destroy() {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.removeAllListeners();
  }
}

export const config = ConfigService.get();
