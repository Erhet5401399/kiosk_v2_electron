import type { StepConfig } from '../../types/steps';
import { getStepDefinition, registerStepDefinition, STEP_DEFINITIONS } from './definitions';

export const STEP_REGISTRY = STEP_DEFINITIONS as unknown as Record<string, StepConfig>;

export function getStepConfig(stepId: string): StepConfig {
  const config = STEP_REGISTRY[stepId];
  if (config) return config;

  // Keep the flow alive for backend-provided unknown step ids so
  // StepRenderer can display its "step not found" fallback UI.
  return {
    id: stepId,
    title: `Unknown step (${stepId})`,
  };
}

export function registerStep(config: StepConfig): void {
  const existing = getStepDefinition(config.id);
  registerStepDefinition({
    ...existing,
    ...config,
  });
}
