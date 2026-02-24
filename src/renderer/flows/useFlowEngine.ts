import { useState, useCallback, useMemo } from 'react';
import { FlowEngine, type FlowState } from './FlowEngine';
import type { StepContext, ServiceFlowConfig } from '../types/steps';

interface UseFlowEngineOptions {
  serviceId: number;
  customConfig?: ServiceFlowConfig;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface UseFlowEngineReturn {
  engine: FlowEngine;
  state: FlowState;
  currentStep: string;
  progress: { current: number; total: number; percentage: number };
  canGoNext: boolean;
  canGoBack: boolean;
  goToNext: () => boolean;
  goToBack: () => boolean;
  goToStep: (stepId: string) => boolean;
  updateStepData: (data: Record<string, unknown>) => void;
  validateAndNext: (context: Partial<StepContext>) => boolean;
  complete: () => void;
  cancel: () => void;
  reset: () => void;
}

export function useFlowEngine(options: UseFlowEngineOptions): UseFlowEngineReturn {
  const [, forceUpdate] = useState({});

  const engine = useMemo(() => {
    return new FlowEngine({
      serviceId: options.serviceId,
      customConfig: options.customConfig,
      onStepChange: () => forceUpdate({}),
      onComplete: options.onComplete,
      onCancel: options.onCancel,
    });
  }, [options.customConfig, options.serviceId]);

  const state = engine.getState();
  const progress = engine.getProgress();

  const goToNext = useCallback(() => {
    const result = engine.goToNext();
    forceUpdate({});
    return result;
  }, [engine]);

  const goToBack = useCallback(() => {
    const result = engine.goToBack();
    forceUpdate({});
    return result;
  }, [engine]);

  const goToStep = useCallback((stepId: string) => {
    const result = engine.goToStep(stepId);
    forceUpdate({});
    return result;
  }, [engine]);

  const updateStepData = useCallback((data: Record<string, unknown>) => {
    engine.updateStepData(data);
    forceUpdate({});
  }, [engine]);

  const validateAndNext = useCallback((context: Partial<StepContext>) => {
    const validation = engine.validateCurrentStep(context);
    if (!validation.isValid) {
      if (validation.errorMessage) {
        alert(validation.errorMessage);
      }
      return false;
    }
    return goToNext();
  }, [engine, goToNext]);

  const complete = useCallback(() => {
    engine.complete();
    forceUpdate({});
  }, [engine]);

  const cancel = useCallback(() => {
    engine.cancel();
    forceUpdate({});
  }, [engine]);

  const reset = useCallback(() => {
    engine.reset();
    forceUpdate({});
  }, [engine]);

  return {
    engine,
    state,
    currentStep: state.currentStepId,
    progress,
    canGoNext: engine.canGoNext(),
    canGoBack: engine.canGoBack(),
    goToNext,
    goToBack,
    goToStep,
    updateStepData,
    validateAndNext,
    complete,
    cancel,
    reset,
  };
}
