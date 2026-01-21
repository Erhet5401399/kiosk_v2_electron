import fs from "fs";
import path from "path";
import { app } from "electron";
import crypto from "crypto";

const CONFIG_FILE = path.join(app.getPath("userData"), "config.json");

interface Config {
  deviceId: string;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  };
}

export default class ConfigService {
  private static config: Config | null = null;

  static loadConfig(): Config {
    if (!this.config) {
      try {
        const data = fs.readFileSync(CONFIG_FILE, "utf-8");
        this.config = JSON.parse(data);
      } catch {
        this.config = { deviceId: "" };
      }
    }
    return this.config!;
  }

  static saveConfig(): void {
    if (!this.config) return;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), "utf-8");
  }

  static getDeviceId(): string {
    const cfg = this.loadConfig();
    if (!cfg.deviceId) {
      cfg.deviceId = crypto.randomUUID();
      this.saveConfig();
    }
    return cfg.deviceId;
  }

  static getTokens() {
    return this.loadConfig().tokens || null;
  }

  static setTokens(tokens: Config["tokens"]) {
    const cfg = this.loadConfig();
    cfg.tokens = tokens;
    this.saveConfig();
  }

  static clearTokens() {
    const cfg = this.loadConfig();
    cfg.tokens = undefined;
    this.saveConfig();
  }
}
