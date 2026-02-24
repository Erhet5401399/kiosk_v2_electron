export const APP_NAME = "Эрхэт киоск";

export { MONGOLIAN_KEYBOARD } from "./keyboard";

export const STATE_LABELS: Record<string, string> = {
  initializing: "Initializing system",
  booting: "Booting runtime",
  unregistered: "Device not registered",
  registering: "Registering device",
  authenticating: "Authenticating",
  loading_config: "Loading configuration",
  ready: "Ready",
  offline: "Offline mode",
  error: "Runtime error",
  shutting_down: "Shutting down",
};

export const INITIAL_SNAPSHOT = {
  state: "initializing",
  deviceId: undefined,
  retryCount: 0,
  uptime: 0,
  startedAt: 0,
};