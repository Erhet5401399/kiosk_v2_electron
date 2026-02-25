import type {
  Service,
  PaymentMethod,
  KeyboardInputMode,
  KeyboardTarget,
} from './index';

export type StepId = string;
export type DocumentHttpMethod = "GET" | "POST";

export interface DocumentRequestConfig {
  endpoint: string;
  method?: DocumentHttpMethod;
  params?: string[];
}

export type ServiceFlowStep = StepId | {
  id: StepId;
  title?: string;
  document?: DocumentRequestConfig;
};

export interface StepContext {
  service: Service;
  paymentMethod: PaymentMethod;
  stepData: Record<string, unknown>;
  keyboard: {
    activeTarget: KeyboardTarget | null;
    mode: KeyboardInputMode;
  };
}

export interface StepActions {
  onUpdateStepData: (data: Record<string, unknown>) => void;
  onKeyboardOpen: (
    target: KeyboardTarget,
    options?: { mode?: KeyboardInputMode; maxLength?: number },
  ) => void;
  onKeyboardClose: () => void;
  onKeyboardAppend: (key: string) => void;
  onKeyboardBackspace: () => void;
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
  document?: DocumentRequestConfig;
  validate?: (context: StepContext) => StepValidation;
  onEnter?: (context: StepContext) => void;
  onExit?: (context: StepContext) => void;
}

export interface ServiceFlowConfig {
  serviceId: number;
  steps: ServiceFlowStep[];
  initialStepData?: Record<string, unknown>;
}

export type StepComponentProps = {
  context: StepContext;
  actions: StepActions;
  config: StepConfig;
};
