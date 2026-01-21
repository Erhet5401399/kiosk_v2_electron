import ConfigService from "./configService";

export class DeviceService {
  private static instance: DeviceService;

  private constructor() {}

  static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  getDeviceId(): string {
    return ConfigService.getDeviceId();
  }

  isRegistered(): boolean {
    const cfg = ConfigService.getTokens();
    return !!cfg;
  }
}
