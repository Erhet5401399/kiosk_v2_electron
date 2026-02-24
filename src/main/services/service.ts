import { api } from "./api";
import { logger } from "./logger";

class ServiceApiService {
  private static inst: ServiceApiService;
  private log = logger.child("ServiceApi");

  static get(): ServiceApiService {
    return this.inst || (this.inst = new ServiceApiService());
  }

  private normalizeBase64(payload: unknown): string {
    if (typeof payload === "string") {
      const normalized = payload.trim();
      if (!normalized) return "";

      const maybeHtml = normalized.toLowerCase();
      if (
        maybeHtml.startsWith("<!doctype html") ||
        maybeHtml.startsWith("<html") ||
        maybeHtml.includes("<body")
      ) {
        return Buffer.from(normalized, "utf8").toString("base64");
      }

      return normalized;
    }

    const asRecord = payload as Record<string, unknown> | null;
    const direct = typeof asRecord?.base64 === "string" ? asRecord.base64 : "";
    if (direct) return direct.trim();

    const data = asRecord?.data as unknown;
    if (typeof data === "string") return data.trim();
    if (data && typeof (data as Record<string, unknown>).base64 === "string") {
      return String((data as Record<string, unknown>).base64).trim();
    }
    return "";
  }

  async getFreeLandOwnerReference(register: string): Promise<string> {
    const reg = String(register || "").trim().toUpperCase();
    if (!reg) {
      this.log.warn("Skipping free land owner reference: empty register number");
      return "";
    }

    const query = new URLSearchParams();
    query.set("register_number", reg);
    const url = `/api/kiosk/service/free/land/owner/reference?${query.toString()}`;
    this.log.debug("Fetching free land owner reference", { url });

    try {
      const payload = await api.postText(url);
      return this.normalizeBase64(payload);
    } catch (error) {
      this.log.error("Failed to fetch free land owner reference", error as Error);
      return "";
    }
  }
}

export const serviceApi = ServiceApiService.get();
