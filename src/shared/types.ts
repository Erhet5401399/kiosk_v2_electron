export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
export interface TokenPayload {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  issued_at?: number;
}

export interface DeviceInfo {
  deviceId: string;
  hardwareId?: string;
  hostname?: string;
  platform?: string;
  registeredAt?: number;
}

export interface DeviceConfig {
  device_name: string;
  printer_enabled: boolean;
  kiosk_mode: boolean;
  refresh_interval: number;
  maintenance_mode?: boolean;
  branding?: {
    primary_color?: string;
    logo_url?: string;
    company_name?: string;
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

export type UserAuthMethodType =
  | "webview_oauth"
  | "credentials"
  | "scanner"
  | "third_party";

export interface UserAuthMethod {
  id: string;
  label: string;
  type: UserAuthMethodType;
  enabled: boolean;
}

export interface UserAuthChallenge {
  methodId: string;
  challengeId: string;
  expiresAt: number;
  webUrl?: string;
  callbackUrl?: string;
  meta?: Record<string, unknown>;
}

export interface UserAuthVerifyRequest {
  methodId: string;
  challengeId: string;
  payload: Record<string, unknown>;
}

export interface UserAuthSession {
  sessionId: string;
  methodId: string;
  registerNumber: string;
  issuedAt: number;
  lastActivityAt: number;
  expiresAt: number;
  maxExpiresAt: number;
  claims?: Record<string, unknown>;
}

export type UserAuthStatusReason =
  | "not_authenticated"
  | "manual_logout"
  | "expired";

export interface UserAuthStatus {
  authenticated: boolean;
  session: UserAuthSession | null;
  reason?: UserAuthStatusReason;
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

export interface ServiceCategory {
  id: number;
  name?: string;
  name_mn?: string;
  name_en?: string;
  icon?: string;
  desc?: string;
  status?: boolean;
}

export interface CategoryService {
  id: number;
  name_mn?: string;
  name_en?: string;
  curl?: string;
  status?: boolean;
  cat_id: number;
  price?: string | number;
  config?: {
    steps?: string[];
    initial?: Record<string, unknown>;
  };
}

export interface CreateQpayInvoiceRequest {
  paymentMethod: "qpay" | "qrcode";
  serviceId?: number;
  registerNumber?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateQpayInvoiceResponse {
  invoiceId: string;
  qrText?: string;
  qrImageUrl?: string;
  qrImageBase64?: string;
  deeplink?: string;
  amount?: number;
  status?: string;
}

export interface CheckQpayInvoiceRequest {
  paymentMethod: "qpay" | "qrcode";
  invoiceId: string;
}

export interface CheckQpayInvoiceResponse {
  paid: boolean;
  status?: string;
  paidAt?: string;
}
