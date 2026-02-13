import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';

interface OwnershipResult {
  isValid: boolean;
  ownerName: string;
  expiryDate: string;
  status: string;
}

export function OwnershipCheckStep({ context, actions }: StepComponentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<OwnershipResult | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setResult({
        isValid: true,
        ownerName: 'Батболд Ганзориг',
        expiryDate: '2030-12-31',
        status: 'Хүчинтэй',
      });
      setIsLoading(false);
      actions.onUpdateStepData({ ownershipVerified: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", bounce: 0, stiffness: 320, damping: 34 }}
      className="service-modal"
    >
      <div className='service-modal-body'>
        <div className="step-header">
          <h1>Эзэмших эрх шалгах</h1>
          <p>Газрын эзэмших эрхийн мэдээллийг шалгаж байна</p>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Шалгаж байна...</p>
          </div>
        ) : result ? (
          <div className="ownership-result">
            <div className={`status-badge ${result.isValid ? 'valid' : 'invalid'}`}>
              {result.isValid ? '✅' : '❌'} {result.status}
            </div>
            <div className="result-details">
              <div className="result-row">
                <span>Эзэмшигч:</span>
                <strong>{result.ownerName}</strong>
              </div>
              <div className="result-row">
                <span>Дуусах хугацаа:</span>
                <strong>{result.expiryDate}</strong>
              </div>
              <div className="result-row">
                <span>Регистр:</span>
                <strong>{String(context.stepData.registerNumber || "")}</strong>
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
          <Button onClick={actions.onNext} disabled={isLoading || !result?.isValid}>
            Үргэлжлүүлэх
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
