export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
export interface TokenPayload {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  issuedAt?: number;
}

export interface DeviceInfo {
  deviceId: string;
  hardwareId?: string;
  hostname?: string;
  platform?: string;
  registeredAt?: number;
}

export interface DeviceConfig {
  deviceName: string;
  printerEnabled: boolean;
  kioskMode: boolean;
  refreshInterval: number;
  maintenanceMode?: boolean;
  branding?: {
    primaryColor?: string;
    logoUrl?: string;
    companyName?: string;
  };
}

export interface PrintJob {
  id: string;
  content: string;
  type: "html" | "text" | "pdf";
  copies: number;
  priority: "low" | "normal" | "high";
  status: "queued" | "printing" | "completed" | "failed" | "cancelled";
  createdAt: number;
  attempts: number;
  error?: string;
}

export interface PrinterDevice {
  name: string;
  isDefault: boolean;
  status: "ready" | "busy" | "offline" | "unknown";
}

export interface HealthStatus {
  online: boolean;
  lastCheck: number;
  services: { api: boolean; printer: boolean; storage: boolean };
  metrics: { uptime: number; memoryUsage: number };
}

export type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "installing"
  | "up_to_date"
  | "error";

export interface UpdateStatus {
  state: UpdateState;
  currentVersion: string;
  availableVersion?: string;
  downloadedBytes?: number;
  totalBytes?: number;
  percent?: number;
  lastCheckedAt?: number;
  error?: string;
  mock: boolean;
}

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type RuntimeState =
  | "initializing"
  | "booting"
  | "unregistered"
  | "registering"
  | "authenticating"
  | "loading_config"
  | "ready"
  | "offline"
  | "error"
  | "shutting_down";

export interface RuntimeSnapshot {
  state: RuntimeState;
  deviceId?: string;
  error?: string;
  errorMessage?: string;
  retryCount: number;
  uptime: number;
  startedAt: number;
}

export interface Parcel {
  parcel: string;
  app_id: string;
  app_no: string;
  property_no: string;
  status_code: string;
  app_timestamp: string;
  app_type_code: string;
  app_type_name: string;
  status_desc: string;
  right_type_desc: string;
  au1_name: string;
  approved_landuse: string;
  au2_name: string;
  area_m2: string;
  valid_from: string;
  valid_till: string;
  person_register: string;
}
