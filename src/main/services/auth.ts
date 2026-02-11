import crypto from "crypto";
import { AUTH } from "../core/constants";
import type {
  UserAuthChallenge,
  UserAuthMethod,
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
  startChallenge(): Promise<UserAuthChallenge>;
  verify(
    req: UserAuthVerifyRequest,
    challenge: UserAuthChallenge,
  ): Promise<VerifyResult>;
}

type DanStartResponse = {
  authUrl: string;
  callbackUrl?: string;
  expiresAt?: number;
  mock?: boolean;
};

type DanFinalizeResponse = {
  registerNumber?: string;
  regnum?: string;
  claims?: Record<string, unknown>;
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
      started.callbackUrl || this.defaultCallbackUrl,
    ).trim();
    const expiresAt = Number(started.expiresAt || Date.now() + 5 * 60 * 1000);
    const webUrl = String(started.authUrl || "").trim();

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
        mock: !!started.mock,
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

      const regnum = String(finalized.registerNumber || finalized.regnum || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");

      if (!regnum) {
        throw new Error("Missing register number from DAN finalize");
      }

      if (!/^[\p{Script=Cyrillic}A-Z0-9]{8,12}$/u.test(regnum)) {
        throw new Error("Invalid register number from DAN finalize");
      }

      return {
        registerNumber: regnum,
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
  }

  static get(): UserAuthService {
    return this.inst || (this.inst = new UserAuthService());
  }

  listMethods(): UserAuthMethod[] {
    return [...this.providers.values()].map((provider) => provider.getMethod());
  }

  async start(methodId: string): Promise<UserAuthChallenge> {
    const provider = this.providers.get(methodId);
    if (!provider) {
      throw new Error(`Unknown auth method: ${methodId}`);
    }

    const challenge = await provider.startChallenge();
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
