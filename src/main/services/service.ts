import { ApiResponse, Parcel, ParcelRequest, ServiceCategory } from "../../shared/types";
import { api } from "./api";
import { logger } from "./logger";

type DocumentMethod = "GET" | "POST";

export interface GetDocumentRequest {
  endpoint: string;
  method?: DocumentMethod;
  params?: Record<string, unknown>;
}

class ServiceApiService {
  private static inst: ServiceApiService;
  private log = logger.child("ServiceApi");

  static get(): ServiceApiService {
    return this.inst || (this.inst = new ServiceApiService());
  }

  private toStringPayload(payload: unknown): string {
    if (typeof payload === "string") return payload;

    const asRecord = payload as Record<string, unknown> | null;
    if (!asRecord) return "";

    if (typeof asRecord.base64 === "string") return asRecord.base64;
    if (typeof asRecord.hex === "string") return asRecord.hex;
    if (typeof asRecord.html === "string") return asRecord.html;
    if (typeof asRecord.data === "string") return asRecord.data;
    return "";
  }

  private isHtml(value: string): boolean {
    const lower = value.trim().toLowerCase();
    return (
      lower.startsWith("<!doctype html") ||
      lower.startsWith("<html") ||
      lower.includes("<body")
    );
  }

  private toHexCompact(value: string): string {
    const unwrapped = value.trim().replace(/^["'`]+|["'`]+$/g, "");
    const no0x = unwrapped.replace(/0x/gi, "");
    const noSlashX = no0x.replace(/\\x/gi, "");
    const compact = noSlashX.replace(/[,\s:;_-]/g, "");
    if (!compact || compact.length % 2 !== 0) return "";
    return /^[0-9a-f]+$/i.test(compact) ? compact : "";
  }

  private normalizeDocumentToBase64(payload: unknown): string {
    if (Buffer.isBuffer(payload)) {
      return payload.toString("base64");
    }

    const raw = this.toStringPayload(payload).trim();
    if (!raw) return "";

    if (this.isHtml(raw)) {
      return Buffer.from(raw, "utf8").toString("base64");
    }

    const hex = this.toHexCompact(raw);
    if (hex) {
      return Buffer.from(hex, "hex").toString("base64");
    }

    // Already base64 (e.g. JVBER...)
    return raw.replace(/^["'`]+|["'`]+$/g, "");
  }

  private normalizeDocumentEndpoint(endpoint: string): string {
    const trimmed = String(endpoint || "").trim();
    if (!trimmed) return "";

    const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    const servicePrefix = "/api/kiosk/service";

    const logicalEndpoint = withLeadingSlash.startsWith(`${servicePrefix}/`)
      ? withLeadingSlash.slice(servicePrefix.length)
      : withLeadingSlash;

    return `${servicePrefix}${logicalEndpoint}`;
  }

  private buildDocumentUrl(url: string, params?: Record<string, unknown>): string {
    const query = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value == null) return;
        const normalized = String(value).trim();
        if (!normalized) return;
        query.set(key, normalized);
      });
    }

    const queryString = query.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  async getDocument(request: GetDocumentRequest): Promise<string> {
    const endpoint = this.normalizeDocumentEndpoint(request.endpoint);
    if (!endpoint) {
      this.log.warn("Blocked document request for invalid endpoint", {
        endpoint: request.endpoint,
      });
      return "";
    }

    const method = String(request.method || "POST").toUpperCase() as DocumentMethod;
    if (method !== "GET" && method !== "POST") {
      this.log.warn("Blocked document request for unsupported method", { method });
      return "";
    }

    const url = this.buildDocumentUrl(endpoint, request.params);
    this.log.debug("Fetching document", { method, url });

    try {
      const payload = await api.requestBuffer(method, url);
      return this.normalizeDocumentToBase64(payload);
    } catch (error) {
      this.log.error("Failed to fetch document", error as Error);
      return "";
    }
  }

  async getParcels(register: string): Promise<ApiResponse<Parcel[]> | Parcel[]> {
    const reg = String(register || "").trim().toUpperCase();
    if (!reg) {
      this.log.warn("Skipping parcel fetch: empty register number");
      return [];
    }

    const query = new URLSearchParams();
    query.set('register_number', reg);

    const url = `/api/kiosk/service/active/all/parcel?${query.toString()}`;
    this.log.debug('Fetching parcels:', url);
    return api.post(url);
  }

  async getParcelRequests(register: string): Promise<ApiResponse<ParcelRequest[]> | ParcelRequest[]> {
    const reg = String(register || "").trim().toUpperCase();
    if (!reg) {
      this.log.warn("Skipping parcel request fetch: empty register number");
      return [];
    }

    const query = new URLSearchParams();
    query.set('register_number', reg);

    const url = `/api/kiosk/service/request/check?${query.toString()}`;
    this.log.debug('Fetching parcels:', url);
    return api.post(url);
  }

  async getCategories(): Promise<ApiResponse<ServiceCategory[]> | ServiceCategory[]> {
    const url = '/api/kiosk/service/category/tree';
    this.log.debug('Fetching categories:', url);
    return api.post(url);
  }

}

export const serviceApi = ServiceApiService.get();
