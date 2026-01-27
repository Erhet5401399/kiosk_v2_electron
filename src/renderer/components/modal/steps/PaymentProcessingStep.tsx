import { motion } from 'framer-motion';
import { useEffect } from 'react';
import type { StepComponentProps } from '../../../types/steps';

export function PaymentProcessingStep({ actions }: StepComponentProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      actions.onNext();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="payment-processing"
    >
      <div className="processing-content">
        <div className="processing-spinner" />
        <h2>Төлбөр боловсруулж байна...</h2>
        <p>Түр хүлээнэ үү</p>
      </div>
    </motion.div>
  );
}
