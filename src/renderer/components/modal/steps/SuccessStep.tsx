import { motion } from 'framer-motion';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';

interface SuccessStepExtraProps {
  onPrint?: () => void;
}

export function SuccessStep({
  context,
  actions,
  onPrint,
}: StepComponentProps & SuccessStepExtraProps) {
  const { service } = context;

  const handlePrint = () => {
    onPrint?.();
    actions.onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', bounce: 0, stiffness: 320, damping: 34 }}
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <motion.div
            className="success-icon"
            aria-hidden="true"
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.svg
              className="success-icon-check"
              viewBox="0 0 24 24"
              fill="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.18 }}
            >
              <motion.path
                d="M5.5 12.5L10 17L18.5 8.5"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.16, duration: 0.34, ease: 'easeOut' }}
              />
            </motion.svg>
          </motion.div>
          <h1>Төлбөр амжилттай</h1>
          <p>Таны баримт бэлэн боллоо</p>
          <p className="success-service-name">{service.name}</p>
        </div>
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onComplete}>
            Дуусгах
          </Button>
          <Button onClick={handlePrint}>Хэвлэх</Button>
        </div>
      </div>
    </motion.div>
  );
}
