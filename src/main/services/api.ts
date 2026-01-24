import { net } from "electron";
import { API, ERROR } from "../core/constants";
import { ApiError, NetworkError, AuthError } from "../core/errors";
import { retry, timeout } from "../core/utils";
import { logger } from "./logger";

type Method = "GET" | "POST" | "PUT" | "DELETE";

class ApiClient {
  private static inst: ApiClient;
  private baseUrl = API.BASE_URL;
  private token: string | null = null;
  private log = logger.child("API");

  static get(): ApiClient {
    if (true) {
      return mockApiClient as unknown as ApiClient;
    }
    return this.inst || (this.inst = new ApiClient());
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private makeRequest<T>(
    method: Method,
    url: string,
    body?: unknown,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const fullUrl = url.startsWith("http") ? url : `${this.baseUrl}${url}`;
      this.log.debug(`${method} ${url}`);

      const req = net.request({ method, url: fullUrl });
      req.setHeader("Content-Type", "application/json");
      if (this.token) req.setHeader("Authorization", `Bearer ${this.token}`);

      let data = "";
      req.on("response", (res) => {
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = data ? JSON.parse(data) : null;
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else if (res.statusCode === 401) {
              reject(new AuthError(ERROR.AUTH_EXPIRED));
            } else {
              reject(
                new ApiError(
                  res.statusCode,
                  parsed?.message || `HTTP ${res.statusCode}`,
                  parsed,
                ),
              );
            }
          } catch {
            reject(new ApiError(res.statusCode, "Parse error"));
          }
        });
      });

      req.on("error", (e) => reject(new NetworkError(e.message)));
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  async request<T>(method: Method, url: string, body?: unknown): Promise<T> {
    const exec = () =>
      timeout(this.makeRequest<T>(method, url, body), API.TIMEOUT);

    return retry(exec, API.RETRY_ATTEMPTS, API.RETRY_DELAY).catch((e) => {
      this.log.error(`${method} ${url} failed`, e);
      throw e;
    });
  }

  get<T>(url: string) {
    return this.request<T>("GET", url);
  }
  post<T>(url: string, body?: unknown) {
    return this.request<T>("POST", url, body);
  }
  put<T>(url: string, body?: unknown) {
    return this.request<T>("PUT", url, body);
  }
  del<T>(url: string) {
    return this.request<T>("DELETE", url);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await timeout(this.makeRequest("GET", "/health"), 5000);
      return true;
    } catch {
      return false;
    }
  }
}

const mockApiClient = {
  setToken: (token: string | null) => {},
  request: async <T>(
    method: Method,
    url: string,
    body?: unknown,
  ): Promise<T> => {
    if (url === "/device/register") {
      return {
        tokens: {
          accessToken: "mock-token",
          refreshToken: "mock-refresh",
          expiresAt: Date.now() + 3600_000,
        },
      } as unknown as T;
    }
    if (url === "/auth/device-login") {
      return {
        accessToken: "mock-token",
        refreshToken: "mock-refresh",
        expiresAt: Date.now() + 3600_000,
      } as unknown as T;
    }

    if (url === "/device/config") {
      return {
        deviceName: "Mock Kiosk",
        printerEnabled: true,
        kioskMode: true,
        refreshInterval: 30_000,
        maintenanceMode: false,
      } as unknown as T;
    }

    return {} as T;
  },
  get: function <T>(url: string) {
    return this.request<T>("GET", url);
  },
  post: function <T>(url: string, body?: unknown) {
    return this.request<T>("POST", url, body);
  },
  put: function <T>(url: string, body?: unknown) {
    return this.request<T>("PUT", url, body);
  },
  del: function <T>(url: string) {
    return this.request<T>("DELETE", url);
  },
  healthCheck: async () => true,
};

export const api = ApiClient.get();
