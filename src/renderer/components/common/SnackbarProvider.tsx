import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

type SnackbarTone = "info" | "success" | "error";

type SnackbarPayload = {
  message: string;
  tone?: SnackbarTone;
  durationMs?: number;
};

type SnackbarItem = Required<SnackbarPayload> & { id: number };

type SnackbarContextValue = {
  showSnackbar: (payload: SnackbarPayload) => void;
  showInfo: (message: string, durationMs?: number) => void;
  showSuccess: (message: string, durationMs?: number) => void;
  showError: (message: string, durationMs?: number) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<SnackbarItem[]>([]);

  const dismissCurrent = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  const showSnackbar = useCallback((payload: SnackbarPayload) => {
    const normalizedMessage = String(payload.message || "").trim();
    if (!normalizedMessage) return;

    setQueue((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        message: normalizedMessage,
        tone: payload.tone || "info",
        durationMs: payload.durationMs ?? 2600,
      },
    ]);
  }, []);

  useEffect(() => {
    if (!queue.length) return;
    const timer = setTimeout(dismissCurrent, queue[0].durationMs);
    return () => clearTimeout(timer);
  }, [queue, dismissCurrent]);

  const value = useMemo<SnackbarContextValue>(
    () => ({
      showSnackbar,
      showInfo: (message, durationMs) =>
        showSnackbar({ message, tone: "info", durationMs }),
      showSuccess: (message, durationMs) =>
        showSnackbar({ message, tone: "success", durationMs }),
      showError: (message, durationMs) =>
        showSnackbar({ message, tone: "error", durationMs }),
    }),
    [showSnackbar],
  );

  const current = queue[0];
  const iconByTone: Record<SnackbarTone, string> = {
    info: "i",
    success: "✓",
    error: "!",
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <div className="snackbar-root">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.id}
              className={`snackbar snackbar-${current.tone}`}
              initial={{ opacity: 0, y: -18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              role="status"
              aria-live="polite"
            >
              <span className="snackbar-icon" aria-hidden="true">
                {iconByTone[current.tone]}
              </span>
              <span className="snackbar-text">{current.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error("useSnackbar must be used within SnackbarProvider");
  }
  return ctx;
}
