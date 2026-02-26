import type {
  StepId,
  StepContext,
  StepConfig,
  ServiceFlowConfig,
  StepValidation,
  ServiceFlowStep,
} from '../types/steps';
import { getStepConfig } from './stepRegistry';
import { getServiceFlowConfig } from './serviceFlowConfig';

export interface FlowState {
  currentStepIndex: number;
  currentStepId: StepId;
  steps: StepId[];
  stepData: Record<string, unknown>;
  history: StepId[];
  isComplete: boolean;
  isCancelled: boolean;
}

export interface FlowEngineOptions {
  serviceId: number;
  customConfig?: ServiceFlowConfig;
  onStepChange?: (stepId: StepId, stepIndex: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export class FlowEngine {
  private state: FlowState;
  private config: ServiceFlowConfig;
  private stepOverrides = new Map<StepId, Partial<StepConfig>>();
  private options: FlowEngineOptions;

  constructor(options: FlowEngineOptions) {
    this.options = options;
    this.config = options.customConfig ?? getServiceFlowConfig(options.serviceId);
    this.state = this.createInitialState();
  }

  private normalizeStepId(step: ServiceFlowStep): StepId {
    return typeof step === 'string' ? step : step.id;
  }

  private buildStepOverrides(steps: ServiceFlowStep[]) {
    this.stepOverrides.clear();
    for (const step of steps) {
      if (typeof step === 'string') continue;
      if (!step.id) continue;
      this.stepOverrides.set(step.id, {
        ...(step.title ? { title: step.title } : {}),
        ...(step.document ? { document: step.document } : {}),
      });
    }
  }

  private createInitialState(): FlowState {
    this.buildStepOverrides(this.config.steps);
    const steps = this.config.steps.map((step) => this.normalizeStepId(step));
    if (!steps.length) {
      throw new Error(`Service flow has no steps: ${this.config.serviceId}`);
    }
    return {
      currentStepIndex: 0,
      currentStepId: steps[0]!,
      steps,
      stepData: { ...this.config.initialStepData },
      history: [steps[0]!],
      isComplete: false,
      isCancelled: false,
    };
  }

  getState(): FlowState {
    return { ...this.state };
  }

  getCurrentStepConfig(): StepConfig {
    const base = getStepConfig(this.state.currentStepId);
    const override = this.stepOverrides.get(this.state.currentStepId);
    return override ? { ...base, ...override } : base;
  }

  getStepConfigs(): StepConfig[] {
    return this.state.steps.map((stepId) => {
      const base = getStepConfig(stepId);
      const override = this.stepOverrides.get(stepId);
      return override ? { ...base, ...override } : base;
    });
  }

  getProgress(): { current: number; total: number; percentage: number } {
    const current = this.state.currentStepIndex + 1;
    const total = this.state.steps.length;
    return {
      current,
      total,
      percentage: Math.round((current / total) * 100),
    };
  }

  validateCurrentStep(context: Partial<StepContext>): StepValidation {
    const stepConfig = this.getCurrentStepConfig();
    if (!stepConfig.validate) {
      return { isValid: true };
    }

    const fullContext: StepContext = {
      service: context.service!,
      paymentMethod: context.paymentMethod ?? null,
      stepData: this.state.stepData,
    };

    return stepConfig.validate(fullContext);
  }

  canGoNext(): boolean {
    return this.state.currentStepIndex < this.state.steps.length - 1;
  }

  canGoBack(): boolean {
    return this.state.currentStepIndex > 0;
  }

  goToNext(): boolean {
    if (!this.canGoNext()) {
      return false;
    }

    const nextIndex = this.state.currentStepIndex + 1;
    const nextStepId = this.state.steps[nextIndex];

    this.state.currentStepIndex = nextIndex;
    this.state.currentStepId = nextStepId;
    this.state.history.push(nextStepId);

    this.options.onStepChange?.(nextStepId, nextIndex);
    return true;
  }

  goToBack(): boolean {
    if (!this.canGoBack()) {
      return false;
    }

    const prevIndex = this.state.currentStepIndex - 1;
    const prevStepId = this.state.steps[prevIndex];

    this.state.currentStepIndex = prevIndex;
    this.state.currentStepId = prevStepId;

    this.options.onStepChange?.(prevStepId, prevIndex);
    return true;
  }

  goToStep(stepId: StepId): boolean {
    const stepIndex = this.state.steps.indexOf(stepId);
    if (stepIndex === -1) {
      return false;
    }

    this.state.currentStepIndex = stepIndex;
    this.state.currentStepId = stepId;
    this.state.history.push(stepId);

    this.options.onStepChange?.(stepId, stepIndex);
    return true;
  }

  updateStepData(data: Record<string, unknown>): void {
    this.state.stepData = {
      ...this.state.stepData,
      ...data,
    };
  }

  complete(): void {
    this.state.isComplete = true;
    this.options.onComplete?.();
  }

  cancel(): void {
    this.state.isCancelled = true;
    this.options.onCancel?.();
  }

  reset(): void {
    this.state = this.createInitialState();
  }

  isOnPaymentStep(): boolean {
    const paymentSteps = ['payment-method', 'payment-processing'];
    return paymentSteps.includes(this.state.currentStepId);
  }

  isOnFinalStep(): boolean {
    return this.state.currentStepIndex === this.state.steps.length - 1;
  }

  hasPayment(): boolean {
    return this.state.steps.includes('payment-method');
  }
}
