import { useState, useCallback, useMemo, useEffect } from 'react';
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
import { useFlowEngine } from '../../flows';

interface ServiceModalProps {
  service: Service;
  registerNumber: string;
  userClaims?: Record<string, unknown>;
  sessionExpiresAt?: number;
  onSessionExpired?: () => void;
  onPrint: (
    registerNumber: string,
    documentBase64?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function ServiceModal({
  service,
  registerNumber,
  userClaims,
  sessionExpiresAt,
  onSessionExpired,
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
    customConfig: service.config,
    onComplete: onClose,
    onCancel: onClose,
  });

  useEffect(() => {
    const claimRegnum = String(userClaims?.regnum || "").trim();
    const resolvedRegister = String(registerNumber || claimRegnum).trim();

    const citizen = {
      regnum: resolvedRegister,
      reghash: String(userClaims?.reghash || "").trim(),
      image: String(userClaims?.image || "").trim(),
      firstname: String(userClaims?.firstname || "").trim(),
      lastname: String(userClaims?.lastname || "").trim(),
      address: String(userClaims?.address || "").trim(),
      personId: String(userClaims?.personId || "").trim(),
      phone: String(userClaims?.phone || "").trim(),
    };

    updateStepData({
      registerNumber: resolvedRegister,
      citizen,
    });
  }, [registerNumber, userClaims, updateStepData]);

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

  const handleBackOrCancel = useCallback(() => {
    const currentStepId = state.currentStepId;
    const isFirstStep = !engine.canGoBack();
    const isSuccessStep = currentStepId === 'success';
    const isLastStep = engine.isOnFinalStep();

    if (isFirstStep || isSuccessStep || isLastStep) {
      cancel();
      return;
    }

    goToBack();
  }, [engine, state.currentStepId, cancel, goToBack]);

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
    onBack: handleBackOrCancel,
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
    handleBackOrCancel,
    goToStep,
    complete,
    cancel,
  ]);

  const stepConfigs = engine.getStepConfigs();
  const currentConfig = engine.getCurrentStepConfig();

  const handlePrintAndClose = async () => {
    const currentRegister = (state.stepData.registerNumber as string) || registerNumber;
    const documentBase64 = String(state.stepData.documentBase64 || "").trim();
    return onPrint(currentRegister, documentBase64 || undefined);
  };

  return (
    <AnimatePresence>
      <ModalWrapper
        onClose={cancel}
        countdownTo={sessionExpiresAt}
        onCountdownEnd={onSessionExpired}
      >
        <div className="service-context-strip">
          <div className="service-context-main">
            <strong className="service-context-name">{service.name}</strong>
            <span className="service-context-price">{service.price} MNT</span>
          </div>
          <span className="service-context-meta">Step {state.currentStepIndex + 1} / {state.steps.length}</span>
        </div>
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
