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
    return !!ConfigService.getTokens();
  }
  async tryRegisterDevice(): Promise<boolean> {
    if (this.isRegistered()) return true;

    console.log("Attempting device registration…");

    await new Promise((r) => setTimeout(r, 1000));

    const success = Math.random() > 0.7;

    if (!success) {
      console.log("Registration failed");
      return false;
    }

    ConfigService.setTokens({
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
    });

    console.log("Registration successful");
    return true;
  }
}
