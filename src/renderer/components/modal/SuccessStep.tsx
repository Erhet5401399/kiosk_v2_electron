import { motion } from "framer-motion";
import type { Service } from "../../types";
import { Button } from "../common";

interface SuccessStepProps {
  service: Service;
  registerNumber: string;
  onPrint: () => void;
  onClose: () => void;
}

export function SuccessStep({
  service,
  registerNumber,
  onPrint,
  onClose,
}: SuccessStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="success-view"
    >
      <div className="success-header">
        <div className="success-icon">✅</div>
        <h1>Төлбөр амжилттай</h1>
        <p>Таны баримт бэлэн боллоо</p>
      </div>

      <div className="pdf-preview-container">
        <div className="pdf-mock-page">
          <div className="pdf-header">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Soyombo_symbol.svg/1200px-Soyombo_symbol.svg.png"
              alt="Soyombo"
              className="pdf-logo"
            />
            <div>
              <h4>ГАЗРЫН ХАРИЛЦАА, ГЕОДЕЗИ, ЗУРАГ ЗҮЙН ГАЗАР</h4>
              <p>Албан ёсны баримт бичиг</p>
            </div>
          </div>
          <hr />
          <div className="pdf-content">
            <div className="pdf-row">
              <span>Үйлчилгээ:</span>
              <strong>{service.name}</strong>
            </div>
            <div className="pdf-row">
              <span>Регистрийн дугаар:</span>
              <strong>{registerNumber}</strong>
            </div>
            <div className="pdf-row">
              <span>Огноо:</span>
              <strong>{new Date().toLocaleDateString()}</strong>
            </div>
            <div className="pdf-row">
              <span>Төлөв:</span>
              <strong style={{ color: "green" }}>Баталгаажсан</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-footer-container">
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Болсон
          </Button>
          <Button onClick={onPrint}>Баримт хэвлэх</Button>
        </div>
      </div>
    </motion.div>
  );
}
