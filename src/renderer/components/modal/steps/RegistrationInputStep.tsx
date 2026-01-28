import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';
import { VirtualKeyboard } from '../../keyboard';

export function RegistrationInputStep({ context, actions }: StepComponentProps) {
  const { service, stepData } = context;
  const [registerNumber, setRegisterNumber] = useState((stepData.registerNumber as string) || '');
  const [showKeyboard, setShowKeyboard] = useState(true);

  useEffect(() => {
    actions.onUpdateStepData({ registerNumber });
  }, [registerNumber]);

  const handleKeyClick = (key: string) => {
    if (registerNumber.length < 10) {
      setRegisterNumber((prev) => prev + key);
    }
  };

  const handleBackspace = () => {
    setRegisterNumber((prev) => prev.slice(0, -1));
  };

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
          className={`registration-input-field ${showKeyboard ? 'active' : ''}`}
          onClick={() => setShowKeyboard(true)}
        >
          <div className="input-label">Регистрийн дугаар</div>
          <div className="input-value">
            {showKeyboard && !registerNumber && <div className="input-cursor" />}
            {registerNumber || <span className="placeholder"></span>}
            {showKeyboard && registerNumber && <div className="input-cursor" />}
          </div>
        </div>

        {showKeyboard && (
          <VirtualKeyboard
            onKeyClick={handleKeyClick}
            onBackspace={handleBackspace}
            onDone={() => setShowKeyboard(false)}
          />
        )}

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
