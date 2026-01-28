import { api } from '../api';
import { logger } from '../logger';

const log = logger.child('Mocks');

export function registerMocks() {
  api.registerMock('/device/register', () => ({
    tokens: {
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh',
      expiresAt: Date.now() + 3600_000,
    },
  }));

  api.registerMock('/auth/device-login', () => ({
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    expiresAt: Date.now() + 3600_000,
  }));

  api.registerMock('/auth/refresh', () => ({
    tokens: {
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh',
      expiresAt: Date.now() + 3600_000,
    },
  }));

  api.registerMock('/device/config', () => ({
    deviceName: 'Mock Kiosk',
    printerEnabled: true,
    kioskMode: true,
    refreshInterval: 30_000,
    maintenanceMode: false,
  }));

  api.registerMock('/health', () => ({ status: 'ok' }));

  log.info('Mocks registered');
}

export function clearAllMocks() {
  api.clearMocks();
  log.info('All mocks cleared');
}