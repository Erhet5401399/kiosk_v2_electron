import crypto from "crypto";
import { AUTH } from "../core/constants";
import type {
  UserAuthChallenge,
  UserAuthMethod,
  UserAuthStartRequest,
  UserAuthSession,
  UserAuthStatus,
  UserAuthVerifyRequest,
} from "../../shared/types";
import { logger } from "./logger";
import { api } from "./api";

type VerifyResult = {
  registerNumber: string;
  claims?: Record<string, unknown>;
};

interface AuthProvider {
  getMethod(): UserAuthMethod;
  startChallenge(payload?: Record<string, unknown>): Promise<UserAuthChallenge>;
  verify(
    req: UserAuthVerifyRequest,
    challenge: UserAuthChallenge,
  ): Promise<VerifyResult>;
}

type DanStartResponse = {
  auth_url?: string;
  callback_url?: string;
  expires_at?: number;
};

type DanFinalizeResponse = {
  register_number?: string;
  regnum?: string;
  claims?: Record<string, unknown>;
};

type ApiEnvelope<T = Record<string, unknown>> = {
  status: boolean;
  msg: string;
  data: T;
};

class DanBackendProvider implements AuthProvider {
  private method: UserAuthMethod = {
    id: "dan",
    label: "DAN",
    type: "webview_oauth",
    enabled: true,
  };

  private readonly startEndpoint = String(
    process.env.DAN_START_ENDPOINT || "/auth/user/dan/start",
  ).trim();

  private readonly finalizeEndpoint = String(
    process.env.DAN_FINALIZE_ENDPOINT || "/auth/user/dan/finalize",
  ).trim();

  private readonly defaultCallbackUrl = String(
    process.env.DAN_CALLBACK_URL || "https://kiosk.local/auth/dan/callback",
  ).trim();

  private pending = new Map<
    string,
    { callbackUrl: string; expiresAt: number; startedAt: number }
  >();

  getMethod(): UserAuthMethod {
    return this.method;
  }

  async startChallenge(): Promise<UserAuthChallenge> {
    const challengeId = crypto.randomUUID();
    const started = await api.post<DanStartResponse>(this.startEndpoint, {
      challengeId,
      methodId: this.method.id,
    });

    const callbackUrl = String(
      started.callback_url || this.defaultCallbackUrl,
    ).trim();
    const expiresAt = Number(
      started.expires_at || Date.now() + 5 * 60 * 1000,
    );
    const webUrl = String(started.auth_url || "").trim();

    if (!webUrl) {
      throw new Error("DAN start endpoint returned empty auth URL");
    }

    this.pending.set(challengeId, {
      callbackUrl,
      expiresAt,
      startedAt: Date.now(),
    });
    this.prunePending();

    return {
      methodId: this.method.id,
      challengeId,
      expiresAt,
      webUrl,
      callbackUrl,
      meta: {
        provider: "DAN",
        flow: "backend_oauth",
      },
    };
  }

  async verify(
    req: UserAuthVerifyRequest,
    challenge: UserAuthChallenge,
  ): Promise<VerifyResult> {
    const callbackValue = String(req.payload.callbackUrl || "").trim();
    if (!callbackValue) {
      throw new Error("Missing callback URL");
    }

    const pending = this.pending.get(challenge.challengeId);
    if (!pending) {
      throw new Error("Invalid DAN challenge");
    }

    if (Date.now() > pending.expiresAt) {
      this.pending.delete(challenge.challengeId);
      throw new Error("DAN challenge expired");
    }

    const expectedCallback = String(
      pending.callbackUrl || challenge.callbackUrl || "",
    ).trim();

    if (expectedCallback && !callbackValue.startsWith(expectedCallback)) {
      this.pending.delete(challenge.challengeId);
      throw new Error("Invalid callback URL");
    }

    try {
      const finalized = await api.post<DanFinalizeResponse>(
        this.finalizeEndpoint,
        {
          methodId: this.method.id,
          challengeId: challenge.challengeId,
          callbackUrl: callbackValue,
          expectedCallbackUrl: expectedCallback,
        },
      );

      const registerNumber = String(
        finalized.register_number || finalized.regnum || "",
      )
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");

      if (!registerNumber) {
        throw new Error("Missing register number from DAN finalize");
      }

      if (!/^[\p{Script=Cyrillic}A-Z0-9]{8,12}$/u.test(registerNumber)) {
        throw new Error("Invalid register number from DAN finalize");
      }

      return {
        registerNumber,
        claims: {
          provider: "DAN",
          ...(finalized.claims || {}),
        },
      };
    } finally {
      this.pending.delete(challenge.challengeId);
    }
  }

  private prunePending() {
    const now = Date.now();
    this.pending.forEach((item, id) => {
      if (item.expiresAt <= now) this.pending.delete(id);
    });
  }
}

class SmsBackendProvider implements AuthProvider {
  private method: UserAuthMethod = {
    id: "sms",
    label: "SMS",
    type: "credentials",
    enabled: true,
  };

  private readonly checkEndpoint = String(
    process.env.SMS_CHECK_ENDPOINT ||
      "/api/kiosk/service/register/phone/check",
  ).trim();

  private readonly sendEndpoint = String(
    process.env.SMS_SEND_ENDPOINT || "/api/kiosk/service/confirm/sms/send",
  ).trim();

  private readonly verifyEndpoint = String(
    process.env.SMS_VERIFY_ENDPOINT || "/api/kiosk/service/auth/login/check",
  ).trim();

  private readonly challengeTtlMs = Number(
    process.env.SMS_CHALLENGE_TTL_MS || 5 * 60 * 1000,
  );
  private readonly bypassEnabled = String(process.env.SMS_AUTH_BYPASS || "false")
    .trim()
    .toLowerCase() === "true";
  private readonly bypassCode = String(process.env.SMS_AUTH_BYPASS_CODE || "123456")
    .trim();

  private pending = new Map<
    string,
    { registerNumber: string; phoneNumber: string; expiresAt: number }
  >();

  getMethod(): UserAuthMethod {
    return this.method;
  }

  async startChallenge(payload?: Record<string, unknown>): Promise<UserAuthChallenge> {
    const registerNumber = this.normalizeRegisterNumber(payload?.registerNumber);
    const phoneNumber = this.normalizePhoneNumber(payload?.phoneNumber);
    if (!registerNumber || !phoneNumber) {
      throw new Error("Register number and phone number are required");
    }

    if (!this.bypassEnabled) {
      await this.callSmsApi(this.checkEndpoint, { registerNumber, phoneNumber });
      await this.callSmsApi(this.sendEndpoint, { registerNumber, phoneNumber });
    }

    const challengeId = crypto.randomUUID();
    const expiresAt = Date.now() + this.challengeTtlMs;

    this.pending.set(challengeId, { registerNumber, phoneNumber, expiresAt });
    this.prunePending();

    return {
      methodId: this.method.id,
      challengeId,
      expiresAt,
      meta: {
        provider: "SMS",
        flow: "phone_code",
        phoneMasked: this.maskPhone(phoneNumber),
      },
    };
  }

  async verify(
    req: UserAuthVerifyRequest,
    challenge: UserAuthChallenge,
  ): Promise<VerifyResult> {
    const pending = this.pending.get(challenge.challengeId);
    if (!pending) {
      throw new Error("Invalid SMS challenge");
    }
    if (Date.now() > pending.expiresAt) {
      this.pending.delete(challenge.challengeId);
      throw new Error("SMS challenge expired");
    }

    const sendCode = String(req.payload.sendCode || "").trim();
    if (!/^\d{4,6}$/.test(sendCode)) {
      throw new Error("Invalid SMS code");
    }

    const verified = this.bypassEnabled
      ? this.verifyBypassCode(sendCode, pending.registerNumber)
      : await this.callSmsApi<Record<string, unknown>>(
        this.verifyEndpoint,
        {
          registerNumber: pending.registerNumber,
          phoneNumber: pending.phoneNumber,
          sendCode,
        },
      );

    const registerNumber = String(
      verified.register_number || verified.regnum || pending.registerNumber,
    )
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    if (!registerNumber) {
      throw new Error("Missing register number from SMS login");
    }

    this.pending.delete(challenge.challengeId);

    return {
      registerNumber,
      claims: {
        provider: "SMS",
        phoneNumber: pending.phoneNumber,
        ...verified,
      },
    };
  }

  private async callSmsApi<T = Record<string, unknown>>(
    endpoint: string,
    data: { registerNumber: string; phoneNumber: string; sendCode?: string },
  ): Promise<T> {
    const response = await api.post<ApiEnvelope<T>>(this.withParams(endpoint, data));
    if (!response || response.status !== true) {
      const message = String(response?.msg || "SMS authentication request failed");
      throw new Error(message);
    }
    return (response.data || {}) as T;
  }

  private withParams(
    endpoint: string,
    data: { registerNumber: string; phoneNumber: string; sendCode?: string },
  ): string {
    const params = new URLSearchParams();
    params.set("register_number", data.registerNumber);
    params.set("phone_number", data.phoneNumber);
    if (data.sendCode) {
      params.set("send_code", data.sendCode);
    }
    return `${endpoint}?${params.toString()}`;
  }

  private normalizeRegisterNumber(value: unknown): string {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  private normalizePhoneNumber(value: unknown): string {
    return String(value || "").replace(/[^\d]/g, "");
  }

  private maskPhone(phoneNumber: string): string {
    if (phoneNumber.length <= 4) {
      return phoneNumber;
    }
    return `${"*".repeat(phoneNumber.length - 4)}${phoneNumber.slice(-4)}`;
  }

  private prunePending() {
    const now = Date.now();
    this.pending.forEach((item, id) => {
      if (item.expiresAt <= now) this.pending.delete(id);
    });
  }

  private verifyBypassCode(sendCode: string, registerNumber: string): Record<string, unknown> {
    if (sendCode !== this.bypassCode) {
      throw new Error("Invalid SMS code");
    }

    return {
      register_number: registerNumber,
      claims: {
        provider: "SMS",
        bypass: true,
      },
    };
  }
}

class UserAuthService {
  private static inst: UserAuthService;
  private log = logger.child("UserAuth");
  private providers = new Map<string, AuthProvider>();
  private activeSession: UserAuthSession | null = null;
  private challenges = new Map<
    string,
    { methodId: string; expiresAt: number; challenge: UserAuthChallenge }
  >();

  private idleMs = AUTH.USER_SESSION_IDLE_MS;
  private maxMs = AUTH.USER_SESSION_MAX_MS;

  private constructor() {
    this.registerProvider(new DanBackendProvider());
    this.registerProvider(new SmsBackendProvider());
  }

  static get(): UserAuthService {
    return this.inst || (this.inst = new UserAuthService());
  }

  listMethods(): UserAuthMethod[] {
    return [...this.providers.values()].map((provider) => provider.getMethod());
  }

  async start(req: UserAuthStartRequest | string): Promise<UserAuthChallenge> {
    const methodId = typeof req === "string" ? req : req.methodId;
    const payload = typeof req === "string" ? undefined : req.payload;
    const provider = this.providers.get(methodId);
    if (!provider) {
      throw new Error(`Unknown auth method: ${methodId}`);
    }

    const challenge = await provider.startChallenge(payload);
    this.challenges.set(challenge.challengeId, {
      methodId: challenge.methodId,
      expiresAt: challenge.expiresAt,
      challenge,
    });
    return challenge;
  }

  async verify(req: UserAuthVerifyRequest): Promise<UserAuthStatus> {
    const provider = this.providers.get(req.methodId);
    if (!provider) {
      throw new Error(`Unknown auth method: ${req.methodId}`);
    }

    const challenge = this.challenges.get(req.challengeId);
    if (!challenge || challenge.methodId !== req.methodId) {
      throw new Error("Invalid authentication challenge");
    }
    if (Date.now() > challenge.expiresAt) {
      this.challenges.delete(req.challengeId);
      throw new Error("Authentication challenge expired");
    }

    const verified = await provider.verify(req, challenge.challenge);
    this.challenges.delete(req.challengeId);

    const now = Date.now();
    this.activeSession = {
      sessionId: crypto.randomUUID(),
      methodId: req.methodId,
      registerNumber: verified.registerNumber,
      issuedAt: now,
      lastActivityAt: now,
      expiresAt: now + this.idleMs,
      maxExpiresAt: now + this.maxMs,
      claims: verified.claims,
    };

    this.log.info("User authenticated", {
      methodId: req.methodId,
      registerSuffix: verified.registerNumber.slice(-4),
    });

    return this.getStatus();
  }

  touch(): UserAuthStatus {
    if (!this.activeSession) return this.getStatus();
    if (!this.ensureSessionValid()) return this.getStatus();

    const now = Date.now();
    this.activeSession.lastActivityAt = now;
    this.activeSession.expiresAt = Math.min(
      now + this.idleMs,
      this.activeSession.maxExpiresAt,
    );

    return this.getStatus();
  }

  logout(reason: UserAuthStatus["reason"] = "manual_logout"): UserAuthStatus {
    if (this.activeSession) {
      this.log.info("User session cleared", {
        sessionId: this.activeSession.sessionId,
        reason,
      });
    }
    this.activeSession = null;
    return { authenticated: false, session: null, reason };
  }

  getStatus(): UserAuthStatus {
    if (!this.activeSession) {
      return { authenticated: false, session: null, reason: "not_authenticated" };
    }
    if (!this.ensureSessionValid()) {
      return { authenticated: false, session: null, reason: "expired" };
    }
    return { authenticated: true, session: { ...this.activeSession } };
  }

  private registerProvider(provider: AuthProvider) {
    const method = provider.getMethod();
    this.providers.set(method.id, provider);
  }

  private ensureSessionValid(): boolean {
    if (!this.activeSession) return false;
    const now = Date.now();
    const expired =
      now > this.activeSession.expiresAt || now > this.activeSession.maxExpiresAt;
    if (!expired) return true;
    this.logout("expired");
    return false;
  }
}

export const userAuth = UserAuthService.get();
