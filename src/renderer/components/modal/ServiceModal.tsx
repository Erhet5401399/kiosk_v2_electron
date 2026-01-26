import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Service, PaymentStep as PaymentStepType, PaymentMethod, KeyboardTarget } from '../../types';
import { ModalWrapper } from './ModalWrapper';
import { InfoStep } from './InfoStep';
import { PaymentStep } from './PaymentStep';
import { SuccessStep } from './SuccessStep';

interface ServiceModalProps {
  service: Service;
  registerPrefix: string;
  registerSuffix: string;
  registerNumber: string;
  showKeyboard: boolean;
  keyboardTarget: KeyboardTarget;
  onSetShowKeyboard: (show: boolean) => void;
  onSetKeyboardTarget: (target: KeyboardTarget) => void;
  onKeyClick: (key: string) => void;
  onBackspace: () => void;
  onPrint: () => void;
  onClose: () => void;
}

export function ServiceModal({
  service,
  registerPrefix,
  registerSuffix,
  registerNumber,
  showKeyboard,
  keyboardTarget,
  onSetShowKeyboard,
  onSetKeyboardTarget,
  onKeyClick,
  onBackspace,
  onPrint,
  onClose,
}: ServiceModalProps) {
  const [paymentStep, setPaymentStep] = useState<PaymentStepType>('info');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);

  const handleStartPayment = () => {
    if (!registerNumber || registerNumber.length < 7) {
      alert('Регистрийн дугаараа зөв оруулна уу.');
      return;
    }
    setPaymentStep('payment');
  };

  const simulatePayment = (method: 'qrcode' | 'pos') => {
    setPaymentMethod(method);
    setTimeout(() => {
      setPaymentStep('success');
    }, 2000);
  };

  return (
    <AnimatePresence>
      <ModalWrapper onClose={onClose}>
        {paymentStep === 'info' && (
          <InfoStep
            service={service}
            registerPrefix={registerPrefix}
            registerSuffix={registerSuffix}
            showKeyboard={showKeyboard}
            keyboardTarget={keyboardTarget}
            onSetShowKeyboard={onSetShowKeyboard}
            onSetKeyboardTarget={onSetKeyboardTarget}
            onKeyClick={onKeyClick}
            onBackspace={onBackspace}
            onStartPayment={handleStartPayment}
            onCancel={onClose}
          />
        )}

        {paymentStep === 'payment' && (
          <PaymentStep
            paymentMethod={paymentMethod}
            onSelectPayment={simulatePayment}
            onBack={() => setPaymentStep('info')}
          />
        )}

        {paymentStep === 'success' && (
          <SuccessStep
            service={service}
            registerNumber={registerNumber}
            onPrint={onPrint}
            onClose={onClose}
          />
        )}
      </ModalWrapper>
    </AnimatePresence>
  );
}
