import { useState, useCallback, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import type {
  Service,
  PaymentMethod,
} from '../../types';
import type { StepContext, StepActions } from '../../types/steps';
import { ModalWrapper } from './ModalWrapper';
import { StepRenderer } from './StepRenderer';
import { FlowProgressBar } from './FlowProgressBar';
import { useFlowEngine } from '../../flows';
import type { UserAuthSession } from "../../../shared/types";

interface ServiceModalProps {
  service: Service;
  registerNumber: string;
  userClaims?: Record<string, unknown>;
  sessionExpiresAt?: number;
  onSessionExpired?: () => void;
  onAuthSuccess?: (session: UserAuthSession) => void;
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
  onAuthSuccess,
  onPrint,
  onClose,
}: ServiceModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);

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
      register_number: resolvedRegister,
      citizen,
    });
  }, [registerNumber, userClaims, updateStepData]);

  const context: StepContext = useMemo(() => ({
    service,
    paymentMethod,
    stepData: state.stepData,
  }), [service, paymentMethod, state.stepData]);

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
    const previousStepId =
      state.currentStepIndex > 0
        ? state.steps[state.currentStepIndex - 1]
        : null;
    const shouldCloseInsteadOfReturningToAuth = previousStepId === "auth-gate";

    if (isFirstStep || isSuccessStep || isLastStep || shouldCloseInsteadOfReturningToAuth) {
      cancel();
      return;
    }

    goToBack();
  }, [engine, state.currentStepId, state.currentStepIndex, state.steps, cancel, goToBack]);

  const actions: StepActions = useMemo(() => ({
    onUpdateStepData: (data) => {
      if (data.paymentMethod) {
        setPaymentMethod(data.paymentMethod as PaymentMethod);
      }
      const session = data.auth_session as UserAuthSession | undefined;
      if (session) {
        onAuthSuccess?.(session);
      }
      updateStepData(data);
    },
    onNext: handleNext,
    onBack: handleBackOrCancel,
    onGoToStep: goToStep,
    onComplete: complete,
    onCancel: cancel,
  }), [
    updateStepData,
    onAuthSuccess,
    handleNext,
    handleBackOrCancel,
    goToStep,
    complete,
    cancel,
  ]);

  const stepConfigs = engine.getStepConfigs();
  const currentConfig = engine.getCurrentStepConfig();
  const isAuthStep = state.currentStepId === "auth-gate";

  const handlePrintAndClose = async () => {
    const currentRegister = (state.stepData.register_number as string) || registerNumber;
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
      </ModalWrapper>
    </AnimatePresence>
  );
}
