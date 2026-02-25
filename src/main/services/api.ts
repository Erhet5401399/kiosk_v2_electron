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

  private makeRequestText(
    method: Method,
    url: string,
    body?: unknown,
  ): Promise<string> {
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
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(String(data || "").trim());
            return;
          }

          if (res.statusCode === 401) {
            reject(new AuthError(ERROR.AUTH_EXPIRED));
            return;
          }

          reject(new ApiError(res.statusCode, `HTTP ${res.statusCode}`, data));
        });
      });

      req.on("error", (e) => reject(new NetworkError(e.message)));
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  private makeRequestBuffer(
    method: Method,
    url: string,
    body?: unknown,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const fullUrl = url.startsWith("http") ? url : `${this.baseUrl}${url}`;
      this.log.debug(`${method} ${url}`);

      const req = net.request({ method, url: fullUrl });
      req.setHeader("Content-Type", "application/json");
      if (this.token) req.setHeader("Authorization", `Bearer ${this.token}`);

      const chunks: Buffer[] = [];
      req.on("response", (res) => {
        res.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        res.on("end", () => {
          const payload = Buffer.concat(chunks);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(payload);
            return;
          }

          if (res.statusCode === 401) {
            reject(new AuthError(ERROR.AUTH_EXPIRED));
            return;
          }

          reject(
            new ApiError(
              res.statusCode,
              `HTTP ${res.statusCode}`,
              payload.toString("utf8"),
            ),
          );
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

  async requestText(method: Method, url: string, body?: unknown): Promise<string> {
    const exec = () =>
      timeout(this.makeRequestText(method, url, body), API.TIMEOUT);

    return retry(exec, API.RETRY_ATTEMPTS, API.RETRY_DELAY).catch((e) => {
      this.log.error(`${method} ${url} failed`, e);
      throw e;
    });
  }

  async requestBuffer(method: Method, url: string, body?: unknown): Promise<Buffer> {
    const exec = () =>
      timeout(this.makeRequestBuffer(method, url, body), API.TIMEOUT);

    return retry(exec, API.RETRY_ATTEMPTS, API.RETRY_DELAY).catch((e) => {
      this.log.error(`${method} ${url} failed`, e);
      throw e;
    });
  }

  get<T>(url: string) {
    return this.request<T>("GET", url);
  }
  getText(url: string) {
    return this.requestText("GET", url);
  }
  postText(url: string, body?: unknown) {
    return this.requestText("POST", url, body);
  }
  postBuffer(url: string, body?: unknown) {
    return this.requestBuffer("POST", url, body);
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
      await timeout(this.request("POST", "/api/health"), 5000);
      return true;
    } catch {
      return false;
    }
  }
}

export const api = ApiClient.get();
