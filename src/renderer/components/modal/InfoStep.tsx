import { motion } from 'framer-motion';
import type { Service, KeyboardTarget } from '../../types';
import { Button } from '../common';
import { SegmentedInput, VirtualKeyboard } from '../keyboard';

interface InfoStepProps {
  service: Service;
  registerPrefix: string;
  registerSuffix: string;
  showKeyboard: boolean;
  keyboardTarget: KeyboardTarget;
  onSetShowKeyboard: (show: boolean) => void;
  onSetKeyboardTarget: (target: KeyboardTarget) => void;
  onKeyClick: (key: string) => void;
  onBackspace: () => void;
  onStartPayment: () => void;
  onCancel: () => void;
}

export function InfoStep({
  service,
  registerPrefix,
  registerSuffix,
  showKeyboard,
  keyboardTarget,
  onSetShowKeyboard,
  onSetKeyboardTarget,
  onKeyClick,
  onBackspace,
  onStartPayment,
  onCancel,
}: InfoStepProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="service-header-modal">
        <div className="service-icon-box large">{service.icon}</div>
        <div>
          <h1>{service.name}</h1>
        </div>
      </div>

      <div>
        <p>{service.desc}</p>
      </div>

      <SegmentedInput
        prefix={registerPrefix}
        suffix={registerSuffix}
        showKeyboard={showKeyboard}
        keyboardTarget={keyboardTarget}
        onPrefixClick={() => {
          onSetShowKeyboard(true);
          onSetKeyboardTarget('prefix');
        }}
        onSuffixClick={() => {
          onSetShowKeyboard(true);
          onSetKeyboardTarget('suffix');
        }}
      />

      {showKeyboard && (
        <VirtualKeyboard
          onKeyClick={onKeyClick}
          onBackspace={onBackspace}
          onDone={() => onSetShowKeyboard(false)}
        />
      )}

      <div className="price-summary-box">
        <span className="label">Нийт төлбөр:</span>
        <span className="value">{service.price}</span>
      </div>

      <div className="modal-footer">
        <Button variant="secondary" onClick={onCancel}>
          Болих
        </Button>
        <Button onClick={onStartPayment}>Төлбөр төлөх</Button>
      </div>
    </motion.div>
  );
}
