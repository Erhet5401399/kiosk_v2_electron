import AuthService from "../services/authService";
import { DeviceConfigService } from "../services/deviceConfigService";
import { DeviceService } from "../services/deviceService";

export class DeviceRuntime {
  private static instance: DeviceRuntime;

  private registered = false;
  private deviceId!: string;

  static getInstance() {
    if (!this.instance) {
      this.instance = new DeviceRuntime();
    }
    return this.instance;
  }

  async initialize() {
    const deviceService = DeviceService.getInstance();

    this.deviceId = deviceService.getDeviceId();
    this.registered = deviceService.isRegistered();

    if (!this.registered) return;

    const auth = AuthService.getInstance();
    await auth.authenticate();

    const configService = DeviceConfigService.getInstance();
    await configService.fetchConfig();
  }

  isRegistrationRequired() {
    return !this.registered;
  }

  getDeviceId() {
    return this.deviceId;
  }
}
