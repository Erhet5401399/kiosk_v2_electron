import { motion } from 'framer-motion';
import type { StepConfig } from '../../types/steps';
import { CheckIcon } from '../common/CheckIcon';

interface FlowProgressBarProps {
  steps: StepConfig[];
  currentIndex: number;
}

export function FlowProgressBar({ steps, currentIndex }: FlowProgressBarProps) {
  return (
    <div className="flow-progress-bar">
      <div className="progress-steps">
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;

          return (
            <div
              key={step.id}
              className={`progress-step ${isActive ? 'active' : 'pending'}`}
            >
              {index > 0 && (
                <motion.div
                  className="step-connector"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isActive ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              )}

              <div className="step-indicator">
                {index < currentIndex ? (
                  <CheckIcon/>
                ) : (
                  index + 1
                )}
              </div>

              <span className="step-label">{step.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
