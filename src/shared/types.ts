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
