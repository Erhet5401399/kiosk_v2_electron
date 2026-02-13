import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { APP_NAME } from "../../constants";
import { Logo } from "../common";

interface ModalWrapperProps {
  children: ReactNode;
  onClose: () => void;
  title?: string;
  countdownTo?: number;
  onCountdownEnd?: () => void;
}

export function ModalWrapper({
  children,
  onClose,
  title = APP_NAME,
  countdownTo,
  onCountdownEnd,
}: ModalWrapperProps) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    endedRef.current = false;

    if (!countdownTo) {
      setRemainingMs(null);
      return;
    }

    const tick = () => {
      const left = countdownTo - Date.now();
      setRemainingMs(left);
      if (left <= 0 && !endedRef.current) {
        endedRef.current = true;
        onCountdownEnd?.();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [countdownTo, onCountdownEnd]);

  const timeoutLabel = useMemo(() => {
    if (remainingMs === null) return "--:--";
    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [remainingMs]);

  const warning = remainingMs !== null && remainingMs <= 30_000;

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
      }}
      exit={{
        opacity: 0,
        transition: { duration: 0, ease: [0.4, 0, 1, 1] },
      }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content full-height"
        initial={{ y: 24, opacity: 0.98 }}
        animate={{
          y: 0,
          opacity: 1,
          transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
        }}
        exit={{
          y: 20,
          opacity: 0.98,
          transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-fixed">
          <div className="modal-brand">
            <Logo size="small"/>
            <span className="modal-title">{title}</span>
          </div>
          <span className={`modal-timeout${warning ? " is-warning" : ""}`}>
            {timeoutLabel}
          </span>
        </div>
        <div className="modal-scroll-body">{children}</div>
      </motion.div>
    </motion.div>
  );
}
