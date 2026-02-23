import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type {
  UserAuthChallenge,
  UserAuthMethod,
  UserAuthSession,
} from "../../../shared/types";
import { ModalWrapper } from "./ModalWrapper";
import { Button } from "../common";
import { VirtualKeyboard } from "../keyboard";
import { APP_NAME } from "../../constants";
import { SmsAuthPanel } from "./auth/SmsAuthPanel";
import { useSmsAuthKeyboard } from "./auth/useSmsAuthKeyboard";
import { useSnackbar } from "../common";

interface UserAuthModalProps {
  serviceName: string;
  onCancel: () => void;
  onSuccess: (session: UserAuthSession) => void;
}

type WebViewElement = HTMLElement & {
  reload: () => void;
  addEventListener: (
    type: string,
    listener: (event: { url?: string; validatedURL?: string }) => void,
  ) => void;
  removeEventListener: (
    type: string,
    listener: (event: { url?: string; validatedURL?: string }) => void,
  ) => void;
};

export function UserAuthModal({
  onCancel,
  onSuccess,
}: UserAuthModalProps) {
  const [methods, setMethods] = useState<UserAuthMethod[]>([]);
  const [challenge, setChallenge] = useState<UserAuthChallenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authMethodId, setAuthMethodId] = useState<string | null>(null);
  const [loginDeadline, setLoginDeadline] = useState<number | null>(null);

  const smsKeyboard = useSmsAuthKeyboard();
  const { showError, showSuccess } = useSnackbar();

  const webviewRef = useRef<WebViewElement | null>(null);
  const authInFlightRef = useRef(false);

  const selectedMethod = useMemo(
    () => methods.find((m) => m.id === authMethodId) || null,
    [methods, authMethodId],
  );
  const smsMethod = useMemo(
    () => methods.find((m) => m.id === "sms" && m.enabled) || null,
    [methods],
  );
  const danMethod = useMemo(
    () => methods.find((m) => m.id === "dan" && m.enabled) || null,
    [methods],
  );

  const isSmsMethod = selectedMethod?.id === "sms";
  const isSmsChallenge = challenge?.methodId === "sms";
  const smsCodeSent = isSmsMethod && isSmsChallenge;
  const isMockChallenge = Boolean(challenge?.meta?.mock);

  const startAuth = async (
    methodId: string,
    payload?: Record<string, unknown>,
  ) => {
    const started = await window.electron.auth.start({ methodId, payload });
    setChallenge(started);
    setLoginDeadline(started.expiresAt || Date.now() + 60_000);
    return started;
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      setInitializing(true);
      setError(null);

      try {
        const available = await window.electron.auth.listMethods();
        if (!active) return;
        setMethods(available);

        const preferred =
          available.find((m) => m.id === "dan" && m.enabled) ||
          available.find((m) => m.enabled);
        if (!preferred) {
          throw new Error("No authentication method is available");
        }

        setAuthMethodId(preferred.id);
        if (preferred.type === "webview_oauth") {
          const started = await startAuth(preferred.id);
          if (!active) return;
          if (!started.webUrl) {
            throw new Error(
              `Method "${preferred.label}" is not configured for webview flow`,
            );
          }
        }
      } catch (e) {
        if (!active) return;
        const message =
          (e as Error).message || "Failed to initialize authentication";
        setError(message);
        showError(message);
      } finally {
        if (active) setInitializing(false);
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, []);

  const changeMethod = async (nextMethod: UserAuthMethod) => {
    if (loading || authMethodId === nextMethod.id || !nextMethod.enabled) return;
    setAuthMethodId(nextMethod.id);
    setChallenge(null);
    setError(null);
    smsKeyboard.setSmsCode("");
    smsKeyboard.closeKeyboard();
    setLoginDeadline(null);

    if (nextMethod.type !== "webview_oauth") return;

    setLoading(true);
    try {
      const started = await startAuth(nextMethod.id);
      if (!started.webUrl) {
        throw new Error(
          `Method "${nextMethod.label}" is not configured for webview flow`,
        );
      }
    } catch (e) {
      const message = (e as Error).message || "Failed to start authentication";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const verifyFromCallback = async (callbackUrl: string) => {
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
      onSuccess(status.session);
    } catch (e) {
      const message = (e as Error).message || "Authentication failed";
      setError(message);
      showError(message);
      authInFlightRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const sendSmsCode = async () => {
    const normalizedReg = smsKeyboard.registerNumber
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
    const normalizedPhone = smsKeyboard.phoneNumber.replace(/[^\d]/g, "");
    if (!normalizedReg || !normalizedPhone) {
      const message = "Register number and phone number are required";
      setError(message);
      showError(message);
      return;
    }

    setLoading(true);
    setError(null);
    smsKeyboard.setSmsCode("");
    try {
      await startAuth("sms", {
        registerNumber: normalizedReg,
        phoneNumber: normalizedPhone,
      });
      showSuccess("SMS code sent");
      smsKeyboard.focusSmsCode();
    } catch (e) {
      setChallenge(null);
      const message = (e as Error).message || "Failed to send SMS code";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const verifySmsCode = async () => {
    if (!challenge || challenge.methodId !== "sms") return;
    const normalizedCode = smsKeyboard.smsCode.replace(/[^\d]/g, "");
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
      onSuccess(status.session);
    } catch (e) {
      const message = (e as Error).message || "Authentication failed";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const webview = webviewRef.current;
    const callbackUrl = challenge?.callbackUrl;
    if (!webview || !callbackUrl) return;

    const extractUrl = (event: { url?: string; validatedURL?: string }) =>
      String(event.url || event.validatedURL || "");

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
  }, [challenge]);

  const continueMockLogin = () => {
    if (!challenge?.callbackUrl) return;
    const callback = new URL(challenge.callbackUrl);
    callback.searchParams.set("challenge", challenge.challengeId);
    callback.searchParams.set("status", "1");
    callback.searchParams.set("code", "mock-dan-code");
    void verifyFromCallback(callback.toString());
  };

  return (
    <ModalWrapper
      onClose={onCancel}
      title={APP_NAME}
      countdownTo={loginDeadline ?? undefined}
      onCountdownEnd={onCancel}
    >
      <motion.div
        className="service-modal"
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="service-modal-body-login">
          {selectedMethod?.type === "webview_oauth" ? (
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
                  {initializing
                    ? "Preparing authentication..."
                    : "Web authentication is unavailable."}
                </div>
              )}
            </div>
          ) : (
            <div className="auth-sms-layout">
              <SmsAuthPanel
                registerNumber={smsKeyboard.registerNumber}
                phoneNumber={smsKeyboard.phoneNumber}
                smsCode={smsKeyboard.smsCode}
                keyboardTarget={smsKeyboard.keyboardTarget}
                smsCodeSent={smsCodeSent}
                hintText={
                  smsCodeSent
                    ? `Код ${String(challenge?.meta?.phoneMasked || "таны утас")} руу илгээгдлээ`
                    : ""
                }
                onFocusRegister={smsKeyboard.focusRegister}
                onFocusPhone={smsKeyboard.focusPhone}
                onFocusSmsCode={smsKeyboard.focusSmsCode}
              />
            </div>
          )}

        </div>

        <div className="service-modal-footer">
          <div className="modal-footer">
            <Button variant="secondary" onClick={onCancel} disabled={loading}>
              Болих
            </Button>

            {selectedMethod?.type === "webview_oauth" ? (
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
                <Button
                  onClick={
                    isMockChallenge ? continueMockLogin : () => webviewRef.current?.reload()
                  }
                  disabled={
                    loading ||
                    (isMockChallenge ? !challenge?.callbackUrl : !challenge?.webUrl)
                  }
                >
                  {isMockChallenge ? "Mock login" : "Reload"}
                </Button>
              </>
            ) : smsCodeSent ? (
              <Button
                onClick={verifySmsCode}
                disabled={loading || !smsKeyboard.smsCode.trim()}
              >
                Нэвтрэх
              </Button>
            ) : (
              <>
                {danMethod && (
                  <Button
                    variant="secondary"
                    onClick={() => void changeMethod(danMethod)}
                    disabled={loading}
                  >
                    ДАН-аар нэвтрэх
                  </Button>
                )}
                <Button
                  onClick={sendSmsCode}
                  disabled={
                    loading ||
                    !smsKeyboard.registerNumber.trim() ||
                    !smsKeyboard.phoneNumber.trim()
                  }
                >
                  Код авах
                </Button>
              </>
            )}
          </div>
        </div>

        {smsKeyboard.keyboardTarget && selectedMethod?.type !== "webview_oauth" && (
          <div className="modal-keyboard-host">
            <VirtualKeyboard
              mode={smsKeyboard.keyboardMode}
              onKeyClick={smsKeyboard.appendKeyboardValue}
              onBackspace={smsKeyboard.backspaceKeyboardValue}
              onDone={smsKeyboard.closeKeyboard}
            />
          </div>
        )}
      </motion.div>
    </ModalWrapper>
  );
}
