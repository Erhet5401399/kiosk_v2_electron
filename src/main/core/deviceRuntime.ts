import { EventEmitter } from "events";
import AuthService from "../services/authService";
import { DeviceConfigService } from "../services/deviceConfigService";
import { DeviceService } from "../services/deviceService";

export type RuntimeState =
  | "loading"
  | "unregistered"
  | "authenticating"
  | "ready"
  | "error";

export class DeviceRuntime extends EventEmitter {
  private static instance: DeviceRuntime;

  private state: RuntimeState = "loading";
  private deviceId!: string;
  private pollTimer?: NodeJS.Timeout;
  private error?: string;

  static getInstance() {
    if (!this.instance) {
      this.instance = new DeviceRuntime();
    }
    return this.instance;
  }

  async start() {
    try {
      const device = DeviceService.getInstance();

      this.deviceId = device.getDeviceId();

      if (!device.isRegistered()) {
        this.setState("unregistered");
        this.startRegistrationPolling();
        return;
      }

      await this.authenticateAndLoad();
    } catch (e) {
      this.fail("Startup failed");
    }
  }

  private async startRegistrationPolling() {
    this.tryRegister();

    this.pollTimer = setInterval(
      () => this.tryRegister(),
      process.env.NODE_ENV === "development" ? 5_000 : 60_000
    );
  }

  private async tryRegister() {
    const device = DeviceService.getInstance();
    const success = await device.tryRegisterDevice();

    if (!success) return;

    if (this.pollTimer) clearInterval(this.pollTimer);
    await this.authenticateAndLoad();
  }

  private async authenticateAndLoad() {
    try {
      this.setState("authenticating");

      await AuthService.getInstance().authenticate();
      await DeviceConfigService.getInstance().fetchConfig();

      this.setState("ready");
    } catch (e) {
      this.fail("Authentication failed");
    }
  }

  private fail(message: string) {
    this.error = message;
    this.setState("error");
  }

  private setState(state: RuntimeState) {
    console.log("Runtime state changed:", state);
    this.state = state;
    this.emit("state-change", state);
  }

  getSnapshot() {
    return {
      state: this.state,
      deviceId: this.deviceId,
      error: this.error,
    };
  }
}
