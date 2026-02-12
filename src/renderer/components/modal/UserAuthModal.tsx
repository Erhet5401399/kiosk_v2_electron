import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type {
  UserAuthChallenge,
  UserAuthMethod,
  UserAuthSession,
} from "../../../shared/types";
import { ModalWrapper } from "./ModalWrapper";
import { Button } from "../common";
import { APP_NAME } from "../../constants";

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
  serviceName,
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
  const webviewRef = useRef<WebViewElement | null>(null);
  const authInFlightRef = useRef(false);

  const selectedMethod = useMemo(
    () => methods.find((m) => m.id === authMethodId) || null,
    [methods, authMethodId],
  );

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
        const started = await window.electron.auth.start(preferred.id);
        if (!active) return;
        setChallenge(started);
        setLoginDeadline(Date.now() + 60_000);

        if (!started.webUrl) {
          throw new Error(
            `Method "${preferred.label}" is not configured for webview flow`,
          );
        }
      } catch (e) {
        if (!active) return;
        setError((e as Error).message || "Failed to initialize authentication");
      } finally {
        if (active) setInitializing(false);
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, []);

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
      onSuccess(status.session);
    } catch (e) {
      setError((e as Error).message || "Authentication failed");
      authInFlightRef.current = false;
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
        <div className="service-modal-body">
          <div className="step-header">
            <h1>Та нэвтрэх шаардлагатай</h1>
            <p>{serviceName}</p>
          </div>

          <div className="auth-webview-card">
            <div className="input-value">
              {selectedMethod?.label ? `Нэвтрэх төрөл: ${selectedMethod?.label}` : "Loading method..."}
            </div>

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
              <div className="auth-webview-placeholder">
                {initializing ? "Preparing authentication..." : "Web authentication is unavailable."}
              </div>
            )}
          </div>

          {error && <p className="updater-error">{error}</p>}
        </div>

        <div className="service-modal-footer">
          <div className="modal-footer">
            <Button variant="secondary" onClick={onCancel} disabled={loading}>
              Цуцлах
            </Button>
            <Button
              onClick={() => webviewRef.current?.reload()}
              disabled={loading || !challenge?.webUrl}
            >
              Үргэлжлүүлэх
            </Button>
          </div>
        </div>
      </motion.div>
    </ModalWrapper>
  );
}
