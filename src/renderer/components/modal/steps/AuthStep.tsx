import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UserAuthChallenge, UserAuthMethod, UserAuthStatus } from "../../../../shared/types";
import type { StepComponentProps } from "../../../types/steps";
import { Button, useSnackbar } from "../../common";
import { VirtualKeyboard } from "../../keyboard";

type WebViewElement = HTMLElement & {
  reload: () => void;
  send: (channel: string, ...args: unknown[]) => void;
  addEventListener: (
    type: string,
    listener: (event: {
      url?: string;
      validatedURL?: string;
      channel?: string;
      args?: unknown[];
    }) => void,
  ) => void;
  removeEventListener: (
    type: string,
    listener: (event: {
      url?: string;
      validatedURL?: string;
      channel?: string;
      args?: unknown[];
    }) => void,
  ) => void;
};

function normalizeRegister(value: unknown): string {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

export function AuthStep({ actions }: StepComponentProps) {
  const { showError, showSuccess } = useSnackbar();
  const [methods, setMethods] = useState<UserAuthMethod[]>([]);
  const [authMethodId, setAuthMethodId] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<UserAuthChallenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registerNumber, setRegisterNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [loginDeadline, setLoginDeadline] = useState<number | null>(null);

  const [smsKeyboardTarget, setSmsKeyboardTarget] = useState<"register" | "phone" | "code" | null>(null);
  const [showWebviewKeyboard, setShowWebviewKeyboard] = useState(false);
  const [webviewKeyboardMode, setWebviewKeyboardMode] = useState<"alphanumeric" | "numeric">("alphanumeric");

  const webviewRef = useRef<WebViewElement | null>(null);
  const authInFlightRef = useRef(false);

  const selectedMethod = useMemo(
    () => methods.find((method) => method.id === authMethodId) || null,
    [methods, authMethodId],
  );
  const smsMethod = useMemo(
    () => methods.find((method) => method.id === "sms" && method.enabled) || null,
    [methods],
  );
  const danMethod = useMemo(
    () => methods.find((method) => method.id === "dan" && method.enabled) || null,
    [methods],
  );

  const isWebviewMethod = selectedMethod?.type === "webview_oauth";
  const smsCodeSent = selectedMethod?.id === "sms" && challenge?.methodId === "sms";

  const setAuthenticatedState = useCallback((status: UserAuthStatus) => {
    const session = status.session;
    if (!status.authenticated || !session) {
      return;
    }

    const claims = session.claims || {};
    const resolvedRegister = normalizeRegister(claims.regnum || session.registerNumber);
    const citizen = {
      regnum: resolvedRegister,
      reghash: String(claims.reghash || "").trim(),
      image: String(claims.image || "").trim(),
      firstname: String(claims.firstname || "").trim(),
      lastname: String(claims.lastname || "").trim(),
      address: String(claims.address || "").trim(),
      personId: String(claims.personId || "").trim(),
      phone: String(claims.phone || "").trim(),
    };

    actions.onUpdateStepData({
      user_authenticated: true,
      register_number: resolvedRegister,
      user_claims: claims,
      session_expires_at: session.expiresAt,
      auth_session: session,
      citizen,
    });
    actions.onNext();
  }, [actions]);

  const startAuth = useCallback(async (
    methodId: string,
    payload?: Record<string, unknown>,
  ) => {
    const started = await window.electron.auth.start({ methodId, payload });
    setChallenge(started);
    setLoginDeadline(started.expiresAt || Date.now() + 60_000);
    return started;
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      setInitializing(true);
      setLoading(false);
      setError(null);

      try {
        const status = await window.electron.auth.status();
        if (!active) return;
        if (status.authenticated && status.session) {
          setAuthenticatedState(status);
          return;
        }

        const available = await window.electron.auth.listMethods();
        if (!active) return;
        setMethods(available);

        const preferred =
          available.find((method) => method.id === "dan" && method.enabled) ||
          available.find((method) => method.enabled);
        if (!preferred) {
          throw new Error("No authentication method is available");
        }

        setAuthMethodId(preferred.id);
        if (preferred.type === "webview_oauth") {
          const started = await startAuth(preferred.id);
          if (!active) return;
          if (!started.webUrl) {
            throw new Error(`Method "${preferred.label}" is not configured for webview flow`);
          }
        }
      } catch (err) {
        if (!active) return;
        const message = (err as Error).message || "Failed to initialize authentication";
        setError(message);
        showError(message);
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    };

    void init();
    return () => {
      active = false;
    };
    // Intentionally initialize once per mount; avoid re-running on re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeMethod = useCallback(async (method: UserAuthMethod) => {
    if (!method.enabled || method.id === authMethodId || loading) return;
    setAuthMethodId(method.id);
    setChallenge(null);
    setError(null);
    setSmsCode("");
    setSmsKeyboardTarget(null);
    setShowWebviewKeyboard(false);
    setWebviewKeyboardMode("alphanumeric");
    setLoginDeadline(null);

    if (method.type !== "webview_oauth") return;

    setLoading(true);
    try {
      const started = await startAuth(method.id);
      if (!started.webUrl) {
        throw new Error(`Method "${method.label}" is not configured for webview flow`);
      }
    } catch (err) {
      const message = (err as Error).message || "Failed to start authentication";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [authMethodId, loading, showError, startAuth]);

  const verifyFromCallback = useCallback(async (callbackUrl: string) => {
    if (!challenge || authInFlightRef.current) return;
    authInFlightRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const status = await window.electron.auth.verify({
        methodId: challenge.methodId,
        challengeId: challenge.challengeId,
        payload: { callbackUrl },
      });
      if (!status.authenticated || !status.session) {
        throw new Error("Authentication failed");
      }
      showSuccess("Authenticated successfully");
      setAuthenticatedState(status);
    } catch (err) {
      const message = (err as Error).message || "Authentication failed";
      setError(message);
      showError(message);
      authInFlightRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [challenge, setAuthenticatedState, showError, showSuccess]);

  useEffect(() => {
    const webview = webviewRef.current;
    const callbackUrl = challenge?.callbackUrl;
    if (!webview || !callbackUrl) return;

    const extractUrl = (event: { url?: string; validatedURL?: string }) => String(event.url || event.validatedURL || "");

    const onNavigate = (event: { url?: string; validatedURL?: string }) => {
      const nextUrl = extractUrl(event);
      if (nextUrl.startsWith(callbackUrl)) {
        void verifyFromCallback(nextUrl);
      }
    };

    const onFailLoad = (event: { url?: string; validatedURL?: string }) => {
      const nextUrl = extractUrl(event);
      if (nextUrl.startsWith(callbackUrl)) {
        void verifyFromCallback(nextUrl);
      }
    };

    webview.addEventListener("did-navigate", onNavigate);
    webview.addEventListener("did-navigate-in-page", onNavigate);
    webview.addEventListener("did-fail-load", onFailLoad);
    return () => {
      webview.removeEventListener("did-navigate", onNavigate);
      webview.removeEventListener("did-navigate-in-page", onNavigate);
      webview.removeEventListener("did-fail-load", onFailLoad);
    };
  }, [challenge, verifyFromCallback]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview || !isWebviewMethod) return;

    const onIpcMessage = (event: { channel?: string; args?: unknown[] }) => {
      const channel = String(event.channel || "");
      if (channel === "vk-focus") {
        const payload = (event.args?.[0] || {}) as { mode?: string };
        setWebviewKeyboardMode(payload.mode === "numeric" ? "numeric" : "alphanumeric");
        setShowWebviewKeyboard(true);
        return;
      }
      if (channel === "vk-blur") {
        setShowWebviewKeyboard(false);
      }
    };

    webview.addEventListener("ipc-message", onIpcMessage);
    return () => {
      webview.removeEventListener("ipc-message", onIpcMessage);
    };
  }, [isWebviewMethod, challenge?.webUrl]);

  const sendSmsCode = useCallback(async () => {
    const normalizedReg = normalizeRegister(registerNumber);
    const normalizedPhone = String(phoneNumber || "").replace(/[^\d]/g, "");
    if (!normalizedReg || !normalizedPhone) {
      const message = "Register number and phone number are required";
      setError(message);
      showError(message);
      return;
    }

    setLoading(true);
    setError(null);
    setSmsCode("");
    try {
      await startAuth("sms", {
        registerNumber: normalizedReg,
        phoneNumber: normalizedPhone,
      });
      showSuccess("SMS code sent");
      setSmsKeyboardTarget("code");
    } catch (err) {
      setChallenge(null);
      const message = (err as Error).message || "Failed to send SMS code";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, registerNumber, showError, showSuccess, startAuth]);

  const verifySmsCode = useCallback(async () => {
    if (!challenge || challenge.methodId !== "sms") return;
    const normalizedCode = String(smsCode || "").replace(/[^\d]/g, "");
    if (!normalizedCode) {
      const message = "Enter SMS code";
      setError(message);
      showError(message);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const status = await window.electron.auth.verify({
        methodId: challenge.methodId,
        challengeId: challenge.challengeId,
        payload: { sendCode: normalizedCode },
      });
      if (!status.authenticated || !status.session) {
        throw new Error("Authentication failed");
      }
      showSuccess("Authenticated successfully");
      setAuthenticatedState(status);
    } catch (err) {
      const message = (err as Error).message || "Authentication failed";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [challenge, setAuthenticatedState, showError, showSuccess, smsCode]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!loginDeadline) return;
      if (Date.now() < loginDeadline) return;
      window.clearInterval(timer);
      actions.onCancel();
    }, 500);
    return () => {
      window.clearInterval(timer);
    };
  }, [actions, loginDeadline]);

  const sendWebviewKeyboardInput = (payload: { action: "append" | "backspace" | "done"; key?: string }) => {
    webviewRef.current?.send("vk-input", payload);
  };

  const appendSmsKeyboard = (key: string) => {
    if (!smsKeyboardTarget) return;
    if (smsKeyboardTarget === "register") {
      if (registerNumber.length >= 10) return;
      setRegisterNumber((prev) => `${prev}${key}`.toUpperCase());
      return;
    }
    if (!/^\d$/.test(key)) return;
    if (smsKeyboardTarget === "phone") {
      if (phoneNumber.length >= 8) return;
      setPhoneNumber((prev) => `${prev}${key}`);
      return;
    }
    if (smsCode.length >= 6) return;
    setSmsCode((prev) => `${prev}${key}`);
  };

  const backspaceSmsKeyboard = () => {
    if (!smsKeyboardTarget) return;
    if (smsKeyboardTarget === "register") {
      setRegisterNumber((prev) => prev.slice(0, -1));
      return;
    }
    if (smsKeyboardTarget === "phone") {
      setPhoneNumber((prev) => prev.slice(0, -1));
      return;
    }
    setSmsCode((prev) => prev.slice(0, -1));
  };

  const renderFieldValue = (value: string, active: boolean, secure = false) => {
    const displayValue = secure && value ? "•".repeat(value.length) : value;
    return (
      <div className="input-value">
        {active && !displayValue && <div className="input-cursor" />}
        {displayValue || <span className="placeholder" />}
        {active && displayValue && <div className="input-cursor" />}
      </div>
    );
  };

  return (
    <div
      className="service-modal"
    >
      <div className="service-modal-body-login auth-step-fullscreen">
        {error && <p style={{ color: "#c62828", fontWeight: 700, margin: "16px 24px 0" }}>{error}</p>}

        {initializing ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Preparing authentication...</p>
          </div>
        ) : isWebviewMethod ? (
          <div className="auth-webview-card auth-webview-card-full">
            {challenge?.webUrl ? (
              <webview
                className="auth-webview"
                src={challenge.webUrl}
                ref={(node) => {
                  webviewRef.current = node as WebViewElement | null;
                }}
                partition="persist:user-auth"
              />
            ) : (
              <div className="auth-webview-placeholder auth-webview-placeholder-full">
                Web authentication is unavailable.
              </div>
            )}
          </div>
        ) : (
          <div className="auth-sms-layout">
            <div className="auth-sms-card">
              <div className="auth-sms-head">
                <h3>Нэг удаагийн код</h3>
                <p>Регистр болон утасны дугаараа оруулна уу.</p>
              </div>
              <button
                className={`registration-input-field ${smsKeyboardTarget === "register" ? "active" : ""}`}
                onClick={() => setSmsKeyboardTarget("register")}
              >
                <div className="input-label">Регистрийн дугаар</div>
                {renderFieldValue(registerNumber, smsKeyboardTarget === "register")}
              </button>
              <button
                className={`registration-input-field ${smsKeyboardTarget === "phone" ? "active" : ""}`}
                onClick={() => setSmsKeyboardTarget("phone")}
              >
                <div className="input-label">Утасны дугаар</div>
                {renderFieldValue(phoneNumber, smsKeyboardTarget === "phone")}
              </button>
              {smsCodeSent && (
                <button
                  className={`registration-input-field ${smsKeyboardTarget === "code" ? "active" : ""}`}
                  onClick={() => setSmsKeyboardTarget("code")}
                >
                  <div className="input-label">Нэг удаагийн код</div>
                  {renderFieldValue(smsCode, smsKeyboardTarget === "code", true)}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onCancel} disabled={loading}>
            Болих
          </Button>
          {isWebviewMethod ? (
            <>
              {smsMethod && (
                <Button
                  variant="secondary"
                  onClick={() => void changeMethod(smsMethod)}
                  disabled={loading}
                >
                  Нэг удаагийн кодоор нэвтрэх
                </Button>
              )}
            </>
          ) : smsCodeSent ? (
            <>
              {danMethod && (
                <Button
                  variant="secondary"
                  onClick={() => void changeMethod(danMethod)}
                  disabled={loading}
                >
                  ДАН нэвтрэлт
                </Button>
              )}
              <Button onClick={verifySmsCode} disabled={loading || !smsCode.trim()}>
                Нэвтрэх
              </Button>
            </>
          ) : (
            <>
              {danMethod && (
                <Button
                  variant="secondary"
                  onClick={() => void changeMethod(danMethod)}
                  disabled={loading}
                >
                  ДАН нэвтрэлт
                </Button>
              )}
              <Button
                onClick={sendSmsCode}
                disabled={loading || !registerNumber.trim() || !phoneNumber.trim()}
              >
                Код авах
              </Button>
            </>
          )}
        </div>
      </div>

      {smsKeyboardTarget && !isWebviewMethod && (
        <div className="modal-keyboard-host">
          <VirtualKeyboard
            mode={smsKeyboardTarget === "register" ? "alphanumeric" : "numeric"}
            onKeyClick={appendSmsKeyboard}
            onBackspace={backspaceSmsKeyboard}
            onDone={() => setSmsKeyboardTarget(null)}
          />
        </div>
      )}

      {showWebviewKeyboard && isWebviewMethod && (
        <div className="modal-keyboard-host">
          <VirtualKeyboard
            mode={webviewKeyboardMode}
            onKeyClick={(key) => sendWebviewKeyboardInput({ action: "append", key })}
            onBackspace={() => sendWebviewKeyboardInput({ action: "backspace" })}
            onDone={() => sendWebviewKeyboardInput({ action: "done" })}
          />
        </div>
      )}
    </div>
  );
}







