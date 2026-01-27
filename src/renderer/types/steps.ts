import type { Service, PaymentMethod, KeyboardTarget } from './index';

export type StepId = string;

export interface StepContext {
  service: Service;
  paymentMethod: PaymentMethod;
  stepData: Record<string, unknown>;
}

export interface StepActions {
  onUpdateStepData: (data: Record<string, unknown>) => void;
  onNext: () => void;
  onBack: () => void;
  onGoToStep: (stepId: StepId) => void;
  onComplete: () => void;
  onCancel: () => void;
}

export interface StepValidation {
  isValid: boolean;
  errorMessage?: string;
}

export interface StepConfig {
  id: StepId;
  title: string;
  validate?: (context: StepContext) => StepValidation;
  onEnter?: (context: StepContext) => void;
  onExit?: (context: StepContext) => void;
}

export interface ServiceFlowConfig {
  serviceId: number;
  steps: StepId[];
  initialStepData?: Record<string, unknown>;
}

export type StepComponentProps = {
  context: StepContext;
  actions: StepActions;
  config: StepConfig;
};
