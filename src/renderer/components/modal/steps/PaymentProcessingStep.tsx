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
      <div className="step-header">
        <div className="processing-spinner" style={{marginBottom: 20}}/>
        <h1>Төлбөр боловсруулж байна...</h1>
        <p>Түр хүлээнэ үү</p>
      </div>
    </motion.div>
  );
}
