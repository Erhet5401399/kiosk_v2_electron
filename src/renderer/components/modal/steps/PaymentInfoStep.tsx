import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';

interface PaymentRecord {
  date: string;
  amount: string;
  status: string;
}

interface PaymentInfo {
  totalDebt: string;
  lastPayment: string;
  paymentHistory: PaymentRecord[];
}

export function PaymentInfoStep({ context, actions }: StepComponentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [info, setInfo] = useState<PaymentInfo | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInfo({
        totalDebt: '₮0',
        lastPayment: '2024-01-15',
        paymentHistory: [
          { date: '2024-01-15', amount: '₮50,000', status: 'Төлсөн' },
          { date: '2023-07-20', amount: '₮50,000', status: 'Төлсөн' },
          { date: '2023-01-10', amount: '₮50,000', status: 'Төлсөн' },
        ],
      });
      setIsLoading(false);
      actions.onUpdateStepData({ paymentInfoLoaded: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", bounce: 0, stiffness: 320, damping: 34 }}
      className="service-modal payment-info-step"
    >
      <div className='service-modal-body'>
        <div className="step-header">
          <h1>Газрын төлбөрийн мэдээлэл</h1>
          <p>Регистр: {String(context.stepData.registerNumber || '')}</p>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Мэдээлэл ачааллаж байна...</p>
          </div>
        ) : info ? (
          <div className="payment-info-content">
            <div className="info-summary">
              <div className="summary-item">
                <span>Нийт өр:</span>
                <strong className={info.totalDebt === '₮0' ? 'no-debt' : 'has-debt'}>
                  {info.totalDebt}
                </strong>
              </div>
              <div className="summary-item">
                <span>Сүүлийн төлбөр:</span>
                <strong>{info.lastPayment}</strong>
              </div>
            </div>

            <div className="payment-history">
              <h3>Төлбөрийн түүх</h3>
              <div className="history-list">
                {info.paymentHistory.map((record, index) => (
                  <div key={index} className="history-item">
                    <span className="date">{record.date}</span>
                    <span className="amount">{record.amount}</span>
                    <span className="status">{record.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack} disabled={isLoading}>
            Буцах
          </Button>
          <Button onClick={actions.onNext} disabled={isLoading}>
            Үргэлжлүүлэх
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
