import { api } from "./api";
import { logger } from "./logger";

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
      return this.normalizeDocumentToBase64(payload);
    } catch (error) {
      this.log.error("Failed to fetch free land owner reference", error as Error);
      return "";
    }
  }

  async getCadastralMap(parcelId: string): Promise<string> {
    const parcel = String(parcelId || "").trim();
    if (!parcel) {
      this.log.warn("Skipping cadastral map: empty parcel id");
      return "";
    }

    const query = new URLSearchParams();
    query.set("parcel_id", parcel);
    const url = `/api/kiosk/service/print/cadastral/map?${query.toString()}`;
    this.log.debug("Fetching cadastral map", { url });

    try {
      const payload = await api.postBuffer(url);
      return this.normalizeDocumentToBase64(payload);
    } catch (error) {
      this.log.error("Failed to fetch cadastral map", error as Error);
      return "";
    }
  }
}

export const serviceApi = ServiceApiService.get();
