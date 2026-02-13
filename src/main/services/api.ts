import { net } from "electron";
import { API, ERROR } from "../core/constants";
import { ApiError, NetworkError, AuthError } from "../core/errors";
import { retry, timeout } from "../core/utils";
import { logger } from "./logger";

type Method = "GET" | "POST" | "PUT" | "DELETE";

type MockHandler<T = unknown> = (method: Method, url: string, body?: unknown) => T | Promise<T>;

interface MockRoute {
  pattern: string | RegExp;
  handler: MockHandler;
}

class ApiClient {
  private static inst: ApiClient;
  private baseUrl = API.BASE_URL;
  private token: string | null = null;
  private log = logger.child("API");
  private mockRoutes: MockRoute[] = [];
  private useMockFallback = process.env.NODE_ENV === "development";

  static get(): ApiClient {
    return this.inst || (this.inst = new ApiClient());
  }

  setToken(token: string | null) {
    this.token = token;
  }

  setMockFallback(enabled: boolean) {
    this.useMockFallback = enabled;
  }

  registerMock(pattern: string | RegExp, handler: MockHandler) {
    this.mockRoutes.push({ pattern, handler });
    this.log.debug(`Mock registered: ${pattern}`);
  }

  clearMocks() {
    this.mockRoutes = [];
  }

  removeMock(pattern: string | RegExp) {
    this.mockRoutes = this.mockRoutes.filter(r => 
      r.pattern.toString() !== pattern.toString()
    );
  }

  private findMock(url: string): MockRoute | undefined {
    const exactString = this.mockRoutes.find(
      (route) => typeof route.pattern === "string" && url === route.pattern,
    );
    if (exactString) return exactString;

    const bestStringPrefix = this.mockRoutes
      .filter(
        (route): route is MockRoute & { pattern: string } =>
          typeof route.pattern === "string" && url.startsWith(route.pattern),
      )
      .sort((a, b) => b.pattern.length - a.pattern.length)[0];
    if (bestStringPrefix) return bestStringPrefix;

    return this.mockRoutes.find(
      (route) => route.pattern instanceof RegExp && route.pattern.test(url),
    );
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
    const mock = this.findMock(url);
    if (mock) {
      this.log.debug(`[MOCK] ${method} ${url}`);
      return Promise.resolve(mock.handler(method, url, body) as T);
    }

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
      await timeout(this.request("GET", "/health"), 5000);
      return true;
    } catch {
      return true;
    }
  }
}

export const api = ApiClient.get();
