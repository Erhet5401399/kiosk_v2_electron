import ConfigService from "./configService";

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

async function mockBackend(url: string, body: any): Promise<AuthTokens> {
  console.log(`[Mock API] POST ${url}`, body);
  await new Promise((res) => setTimeout(res, 300));

  if (url.endsWith("/refresh-token")) {
    if (body.refreshToken === "valid-refresh") {
      return {
        accessToken: "new-access-token",
        refreshToken: "valid-refresh",
        expiresAt: Date.now() + 3600_000,
      };
    } else {
      throw new Error("Invalid refresh token");
    }
  }

  if (url.endsWith("/device-login")) {
    return {
      accessToken: "device-access-token",
      refreshToken: "valid-refresh",
      expiresAt: Date.now() + 3600_000,
    };
  }

  throw new Error("Unknown endpoint");
}

export default class AuthService {
  private static instance: AuthService;
  private tokens: AuthTokens | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async loadTokens() {
    if (this.tokens) return this.tokens;
    const t = ConfigService.getTokens();
    this.tokens = t || null;
    return this.tokens;
  }

  private async storeTokens(tokens: AuthTokens) {
    this.tokens = tokens;
    ConfigService.setTokens(tokens);
  }

  async clearTokens() {
    this.tokens = null;
    ConfigService.clearTokens();
  }

  async authenticate(): Promise<string> {
    let tokens = await this.loadTokens();
    const deviceId = ConfigService.getDeviceId();

    if (tokens && tokens.accessToken && !this.isExpired(tokens)) {
      return tokens.accessToken;
    }

    if (tokens?.refreshToken) {
      try {
        tokens = await this.refreshToken(tokens.refreshToken);
        await this.storeTokens(tokens);
        return tokens.accessToken;
      } catch {
        console.log("Refresh failed, re-login required");
        await this.clearTokens();
      }
    }

    tokens = await this.deviceLogin(deviceId);
    await this.storeTokens(tokens);
    return tokens.accessToken;
  }

  private isExpired(tokens: AuthTokens) {
    if (!tokens.expiresAt) return false;
    return Date.now() > tokens.expiresAt;
  }

  private async refreshToken(refreshToken: string) {
    return await mockBackend("https://backend.com/refresh-token", { refreshToken });
  }

  private async deviceLogin(deviceId: string) {
    return await mockBackend("https://backend.com/device-login", { deviceId });
  }
}
