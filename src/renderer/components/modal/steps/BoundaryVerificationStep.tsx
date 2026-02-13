import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';

interface BoundaryResult {
  hasDiscrepancy: boolean;
  originalArea: string;
  measuredArea: string;
  discrepancyPercent: number;
}

export function BoundaryVerificationStep({ actions }: StepComponentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<BoundaryResult | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setResult({
        hasDiscrepancy: false,
        originalArea: '500 м²',
        measuredArea: '498 м²',
        discrepancyPercent: 0.4,
      });
      setIsLoading(false);
      actions.onUpdateStepData({ boundaryVerified: true });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 0 }}
      animate={{ opacity: 1, x: 0 }}
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Хил хязгаар баталгаажуулах</h1>
          <p>Газрын хил хязгаарыг кадастрын мэдээлэлтэй тулгаж байна</p>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Тулгалт хийж байна...</p>
          </div>
        ) : result ? (
          <div className="boundary-result">
            <div className={`status-badge ${!result.hasDiscrepancy ? 'valid' : 'warning'}`}>
              {!result.hasDiscrepancy ? '✅ Зөрчилгүй' : '⚠️ Зөрчил илэрсэн'}
            </div>
            <div className="result-details">
              <div className="result-row">
                <span>Анхны талбай:</span>
                <strong>{result.originalArea}</strong>
              </div>
              <div className="result-row">
                <span>Хэмжилт:</span>
                <strong>{result.measuredArea}</strong>
              </div>
              <div className="result-row">
                <span>Зөрүү:</span>
                <strong>{result.discrepancyPercent}%</strong>
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
