export const APP = {
  NAME: "Kiosk",
  VERSION: "1.0.0",
  PROTOCOL: "kiosk-app",
} as const;

export const API = {
  BASE_URL: process.env.API_URL || "http://66.181.168.123:8080",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const AUTH = {
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000,
  MAX_REFRESH_RETRIES: 3,
} as const;

export const STORAGE = {
  ALGORITHM: "aes-256-gcm",
  STATE_FILE: "state.enc.json",
  DEVICE_FILE: "device.enc.json",
  LOG_FILE: "app.log",
  MAX_LOG_SIZE: 10 * 1024 * 1024,
} as const;

export const RUNTIME = {
  REGISTRATION_POLL: 30000,
  HEALTH_CHECK: 60000,
  CONFIG_REFRESH: 300000,
  PERSIST_DEBOUNCE: 500,
} as const;

export const UPDATER = {
  CHECK_INTERVAL_MS: Number(process.env.UPDATE_CHECK_INTERVAL_MS || 6 * 60 * 60 * 1000),
  START_DELAY_MS: Number(process.env.UPDATE_START_DELAY_MS || 30000),
  INSTALL_WINDOW_START: process.env.UPDATE_INSTALL_WINDOW_START || "02:00",
  INSTALL_WINDOW_END: process.env.UPDATE_INSTALL_WINDOW_END || "04:00",
} as const;

export const PRINTER = {
  PATTERN: /Lexmark\s*MS430/i,
  TIMEOUT: 60000,
  MAX_QUEUE: 100,
  RETRY_ATTEMPTS: 3,
} as const;

export const IPC = {
  RUNTIME_SNAPSHOT: "runtime:snapshot",
  RUNTIME_UPDATE: "runtime:update",
  RUNTIME_RETRY: "runtime:retry",
  RUNTIME_RESET: "runtime:reset",

  PRINT: "hardware:print",
  PRINTERS: "hardware:printers",

  CONFIG_GET: "config:get",
  CONFIG_REFRESH: "config:refresh",

  HEALTH: "health:status",

  PARCEL_LIST: "parcel:list",

  UPDATE_STATUS: "update:status",
  UPDATE_CHECK: "update:check",
  UPDATE_INSTALL: "update:install",
  UPDATE_EVENT: "update:event",
} as const;

export const ERROR = {
  AUTH_FAILED: "AUTH_FAILED",
  AUTH_EXPIRED: "AUTH_EXPIRED",
  NETWORK: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  API: "API_ERROR",
  DEVICE_NOT_REGISTERED: "DEVICE_NOT_REGISTERED",
  PRINTER_NOT_FOUND: "PRINTER_NOT_FOUND",
  PRINT_FAILED: "PRINT_FAILED",
  STORAGE: "STORAGE_ERROR",
  UNKNOWN: "UNKNOWN",
} as const;

export type ErrorCode = (typeof ERROR)[keyof typeof ERROR];
