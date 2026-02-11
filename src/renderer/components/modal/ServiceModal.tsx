import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import type {
  Service,
  PaymentMethod,
  KeyboardInputMode,
  KeyboardTarget,
} from '../../types';
import type { StepContext, StepActions } from '../../types/steps';
import { VirtualKeyboard } from '../keyboard';
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
  const [keyboardTarget, setKeyboardTarget] = useState<KeyboardTarget | null>(
    null,
  );
  const [keyboardMode, setKeyboardMode] =
    useState<KeyboardInputMode>('alphanumeric');
  const [keyboardMaxLength, setKeyboardMaxLength] = useState<number | null>(
    null,
  );

  const {
    engine,
    state,
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
    keyboard: {
      activeTarget: keyboardTarget,
      mode: keyboardMode,
    },
  }), [
    service,
    paymentMethod,
    state.stepData,
    keyboardTarget,
    keyboardMode,
  ]);

  const openKeyboard = useCallback(
    (
      target: KeyboardTarget,
      options?: { mode?: KeyboardInputMode; maxLength?: number },
    ) => {
      setKeyboardTarget(target);
      setKeyboardMode(options?.mode || 'alphanumeric');
      setKeyboardMaxLength(
        typeof options?.maxLength === 'number' ? options.maxLength : null,
      );
    },
    [],
  );

  const closeKeyboard = useCallback(() => {
    setKeyboardTarget(null);
    setKeyboardMaxLength(null);
  }, []);

  const appendKeyboardValue = useCallback(
    (key: string) => {
      if (!keyboardTarget) return;

      const currentValue = String(state.stepData[keyboardTarget] || '');
      if (
        typeof keyboardMaxLength === 'number' &&
        currentValue.length >= keyboardMaxLength
      ) {
        return;
      }

      updateStepData({ [keyboardTarget]: currentValue + key });
    },
    [keyboardTarget, keyboardMaxLength, state.stepData, updateStepData],
  );

  const backspaceKeyboardValue = useCallback(() => {
    if (!keyboardTarget) return;
    const currentValue = String(state.stepData[keyboardTarget] || '');
    updateStepData({ [keyboardTarget]: currentValue.slice(0, -1) });
  }, [keyboardTarget, state.stepData, updateStepData]);

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
    onKeyboardOpen: openKeyboard,
    onKeyboardClose: closeKeyboard,
    onKeyboardAppend: appendKeyboardValue,
    onKeyboardBackspace: backspaceKeyboardValue,
    onNext: handleNext,
    onBack: goToBack,
    onGoToStep: goToStep,
    onComplete: complete,
    onCancel: cancel,
  }), [
    updateStepData,
    openKeyboard,
    closeKeyboard,
    appendKeyboardValue,
    backspaceKeyboardValue,
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
        {keyboardTarget && (
          <div className="modal-keyboard-host">
            <VirtualKeyboard
              mode={keyboardMode}
              onKeyClick={appendKeyboardValue}
              onBackspace={backspaceKeyboardValue}
              onDone={closeKeyboard}
            />
          </div>
        )}
      </ModalWrapper>
    </AnimatePresence>
  );
}
