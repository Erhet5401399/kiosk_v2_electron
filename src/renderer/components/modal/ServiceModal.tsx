import { useState, useCallback, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Service, PaymentMethod, KeyboardTarget } from '../../types';
import type { StepContext, StepActions } from '../../types/steps';
import { ModalWrapper } from './ModalWrapper';
import { StepRenderer } from './StepRenderer';
import { FlowProgressBar } from './FlowProgressBar';
import { useFlowEngine } from '../../flows/hooks/useFlowEngine';

interface ServiceModalProps {
  service: Service;
  onPrint: (registerNumber: string) => void;
  onClose: () => void;
}

export function ServiceModal({
  service,
  onPrint,
  onClose,
}: ServiceModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);

  const {
    engine,
    state,
    progress,
    goToNext,
    goToBack,
    goToStep,
    updateStepData,
    complete,
    cancel,
  } = useFlowEngine({
    serviceId: service.id,
    onComplete: onClose,
    onCancel: onClose,
  });

  const context: StepContext = useMemo(() => ({
    service,
    paymentMethod,
    stepData: state.stepData,
  }), [
    service,
    paymentMethod,
    state.stepData,
  ]);

  const handleNext = useCallback(() => {
    const validation = engine.validateCurrentStep(context);
    if (!validation.isValid) {
      if (validation.errorMessage) {
        alert(validation.errorMessage);
      }
      return;
    }
    goToNext();
  }, [engine, context, goToNext]);

  const actions: StepActions = useMemo(() => ({
    onUpdateStepData: (data) => {
      if (data.paymentMethod) {
        setPaymentMethod(data.paymentMethod as PaymentMethod);
      }
      updateStepData(data);
    },
    onNext: handleNext,
    onBack: goToBack,
    onGoToStep: goToStep,
    onComplete: complete,
    onCancel: cancel,
  }), [
    updateStepData,
    handleNext,
    goToBack,
    goToStep,
    complete,
    cancel,
  ]);

  const stepConfigs = engine.getStepConfigs();
  const currentConfig = engine.getCurrentStepConfig();

  const handlePrintAndClose = () => {
    const registerNumber = state.stepData.registerNumber as string || '';
    onPrint(registerNumber);
    complete();
  };

  return (
    <AnimatePresence>
      <ModalWrapper onClose={cancel}>
        <FlowProgressBar steps={stepConfigs} currentIndex={state.currentStepIndex} />
        <StepRenderer
          context={context}
          actions={actions}
          config={currentConfig}
          onPrint={handlePrintAndClose}
        />
      </ModalWrapper>
    </AnimatePresence>
  );
}
