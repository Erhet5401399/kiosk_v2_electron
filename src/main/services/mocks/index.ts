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

  api.registerMock('/auth/user/dan/start', (_, __, body) => {
    const challengeId = String((body as { challengeId?: string })?.challengeId || '').trim();
    if (!challengeId) {
      throw new Error('Missing challengeId');
    }

    const callbackUrl = 'https://kiosk.local/auth/dan/callback';
    const mockLoginPage = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DAN Login</title>
    <style>
      body { margin: 0; padding: 24px; background: #f3f4f6; font-family: Arial, sans-serif; color: #111827; }
      .card { max-width: 520px; margin: 30px auto; background: #fff; border-radius: 14px; padding: 24px; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12); }
      h1 { margin: 0 0 10px; font-size: 24px; }
      p { margin: 0 0 12px; line-height: 1.45; }
      .meta { color: #4b5563; font-size: 13px; }
      .btn { display: inline-block; margin-top: 12px; background: #0b63ce; color: #fff; border-radius: 8px; text-decoration: none; padding: 12px 16px; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>DAN Login (Backend Mock)</h1>
      <p>This page is returned by mocked backend start endpoint.</p>
      <p class="meta">challengeId: ${challengeId}</p>
      <a class="btn" href="${callbackUrl}?challenge=${challengeId}&status=1&code=mock-dan-code">Continue</a>
    </div>
  </body>
</html>`;

    return {
      authUrl: `data:text/html;charset=utf-8,${encodeURIComponent(mockLoginPage)}`,
      callbackUrl,
      expiresAt: Date.now() + 5 * 60 * 1000,
      mock: true,
    };
  });

  api.registerMock('/auth/user/dan/finalize', (_, __, body) => {
    const req = (body || {}) as {
      challengeId?: string;
      callbackUrl?: string;
      expectedCallbackUrl?: string;
    };

    const challengeId = String(req.challengeId || '').trim();
    const callbackUrl = String(req.callbackUrl || '').trim();
    const expectedCallbackUrl = String(req.expectedCallbackUrl || '').trim();

    if (!challengeId || !callbackUrl) {
      throw new Error('Missing finalize payload');
    }
    if (expectedCallbackUrl && !callbackUrl.startsWith(expectedCallbackUrl)) {
      throw new Error('Invalid callback URL');
    }

    const callback = new URL(callbackUrl);
    const status = String(callback.searchParams.get('status') || '');
    const challengeFromCallback = String(callback.searchParams.get('challenge') || '');
    const code = String(callback.searchParams.get('code') || '');

    if (status !== '1') {
      throw new Error('DAN authentication failed');
    }
    if (challengeFromCallback !== challengeId) {
      throw new Error('Invalid DAN challenge');
    }
    if (!code) {
      throw new Error('Missing DAN authorization code');
    }

    return {
      registerNumber: 'РК87071215',
      claims: {
        regnum: 'РК87071215',
        reghash: '9a3dee68asd23',
        image: '',
        firstname: 'Оюунбаяр',
        lastname: 'Хэрлэн',
        address: 'Улаанбаатар, Хан-Уул дүүрэг, 3-р хороо',
        personId: '',
        phone: '',
        code,
        provider: 'DAN',
        mock: true,
      },
    };
  });

  log.info('Mocks registered');
}

export function clearAllMocks() {
  api.clearMocks();
  log.info('All mocks cleared');
}


