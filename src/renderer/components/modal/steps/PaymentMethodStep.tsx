import { motion } from 'framer-motion';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';

export function PaymentMethodStep({ context, actions }: StepComponentProps) {
  const { paymentMethod } = context;

  const handleSelectPayment = (method: 'qrcode' | 'pos') => {
    actions.onUpdateStepData({ paymentMethod: method });
    setTimeout(() => {
      actions.onNext();
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", bounce: 0, stiffness: 320, damping: 34 }}
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Төлбөрийн хэлбэр сонгох</h1>
          <p>Та төлбөрөө дараах аргуудаас сонгон төлнө үү</p>
        </div>

        <div className="payment-grid">
          <button
            className={`payment-option ${paymentMethod === 'qrcode' ? 'loading' : ''}`}
            onClick={() => handleSelectPayment('qrcode')}
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
            onClick={() => handleSelectPayment('pos')}
            disabled={!!paymentMethod}
          >
            <div className="payment-icon">💳</div>
            <div className="payment-info">
              <h3>КАРТ УНШУУЛАХ</h3>
              <span>Бүх төрлийн банкны карт</span>
            </div>
            {paymentMethod === 'pos' && <div className="mini-spinner" />}
          </button>
        </div>
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="ghost"/>
          <Button variant="secondary" onClick={actions.onBack} disabled={!!paymentMethod}>
            Буцах
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
