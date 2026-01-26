import { motion } from 'framer-motion';
import type { PaymentMethod } from '../../types';
import { Button } from '../common';

interface PaymentStepProps {
  paymentMethod: PaymentMethod;
  onSelectPayment: (method: 'qrcode' | 'pos') => void;
  onBack: () => void;
}

export function PaymentStep({ paymentMethod, onSelectPayment, onBack }: PaymentStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="payment-selection"
    >
      <h1>Төлбөрийн хэлбэр сонгох</h1>
      <p>Та төлбөрөө дараах аргуудаас сонгон төлнө үү</p>

      <div className="payment-grid">
        <button
          className={`payment-option ${paymentMethod === 'qrcode' ? 'loading' : ''}`}
          onClick={() => onSelectPayment('qrcode')}
          disabled={!!paymentMethod}
        >
          <div className="payment-icon">📱</div>
          <div className="payment-info">
            <h3>QPAY</h3>
            <span>SocialPay, QPay, Банкны апп</span>
          </div>
          {paymentMethod === 'qrcode' && <div className="mini-spinner" />}
        </button>

        <button
          className={`payment-option ${paymentMethod === 'pos' ? 'loading' : ''}`}
          onClick={() => onSelectPayment('pos')}
          disabled={!!paymentMethod}
        >
          <div className="payment-icon">💳</div>
          <div className="payment-info">
            <h3>Карт уншуулах</h3>
            <span>Бүх төрлийн банкны карт</span>
          </div>
          {paymentMethod === 'pos' && <div className="mini-spinner" />}
        </button>
      </div>

      <div className="modal-footer">
        <Button variant="secondary" onClick={onBack} disabled={!!paymentMethod}>
          Буцах
        </Button>
      </div>
    </motion.div>
  );
}
