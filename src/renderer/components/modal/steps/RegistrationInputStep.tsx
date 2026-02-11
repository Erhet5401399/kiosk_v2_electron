import { motion } from 'framer-motion';
import { useEffect } from 'react';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';

export function RegistrationInputStep({ context, actions }: StepComponentProps) {
  const { service, stepData, keyboard } = context;
  const registerNumber = (stepData.registerNumber as string) || '';
  const isActive = keyboard.activeTarget === 'registerNumber';

  useEffect(() => {
    actions.onKeyboardOpen('registerNumber', { mode: 'alphanumeric', maxLength: 10 });
    return () => actions.onKeyboardClose();
    // Keep this mount-scoped so step transition controls keyboard ownership.
  }, []);

  return (
    <motion.div className="service-modal" initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: 0 }}>
      <div className="service-modal-body">
        <div className="service-header-modal">
          <div className="service-icon-box large">{service.icon}</div>
          <div>
            <h1>{service.name}</h1>
          </div>
        </div>

        <div>
          <p>{service.desc}</p>
        </div>

        <div
          className={`registration-input-field ${isActive ? 'active' : ''}`}
          onClick={() => actions.onKeyboardOpen('registerNumber', { mode: 'alphanumeric', maxLength: 10 })}
        >
          <div className="input-label">Регистрийн дугаар</div>
          <div className="input-value">
            {isActive && !registerNumber && <div className="input-cursor" />}
            {registerNumber || <span className="placeholder" />}
            {isActive && registerNumber && <div className="input-cursor" />}
          </div>
        </div>

        <div className="price-summary-box">
          <span className="label">Нийт төлбөр:</span>
          <span className="value">{service.price}</span>
        </div>
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onCancel}>
            Цуцлах
          </Button>
          <Button onClick={actions.onNext}>Үргэлжлүүлэх</Button>
        </div>
      </div>
    </motion.div>
  );
}
