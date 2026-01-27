import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { APP_NAME } from "../../constants";
import { Logo } from "../common";

interface ModalWrapperProps {
  children: ReactNode;
  onClose: () => void;
  title?: string;
}

export function ModalWrapper({
  children,
  onClose,
  title = APP_NAME,
}: ModalWrapperProps) {
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content full-height"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-fixed">
          <div className="modal-brand">
            <Logo size="small"/>
            <span className="modal-title">{title}</span>
          </div>
          <span className="modal-timeout">05:00</span>
        </div>
        <div className="modal-scroll-body">{children}</div>
      </motion.div>
    </motion.div>
  );
}
