import AuthService from "./authService";

interface DeviceConfig {
  deviceName: string;
  printerEnabled: boolean;
  kioskMode: boolean;
  refreshInterval: number;
}

export class DeviceConfigService {
  private static instance: DeviceConfigService;
  private config: DeviceConfig | null = null;

  private constructor() {}

  static getInstance() {
    if (!DeviceConfigService.instance)
      DeviceConfigService.instance = new DeviceConfigService();
    return DeviceConfigService.instance;
  }

  async fetchConfig(): Promise<DeviceConfig> {
    const auth = AuthService.getInstance();
    const token = await auth.authenticate();
    const config = await this.mockFetchDeviceConfig(token);
    this.config = config;
    return config;
  }

  getConfig(): DeviceConfig | null {
    return this.config;
  }

  private async mockFetchDeviceConfig(token: string): Promise<DeviceConfig> {
    console.log("[Mock API] Fetching device config with token:", token);
    await new Promise(res => setTimeout(res, 300));
    if (!token) throw new Error("Invalid token");

    return {
      deviceName: "Kiosk-001",
      printerEnabled: true,
      kioskMode: true,
      refreshInterval: 60000,
    };
  }
}
