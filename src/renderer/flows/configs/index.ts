import type { ServiceFlowConfig, ServiceFlowStep } from '../../types/steps';

const DEFAULT_FLOW: ServiceFlowStep[] = [
  'registration-input',
  'confirmation',
  'success',
];

export function getServiceFlowConfig(serviceId: number): ServiceFlowConfig {
  return {
    serviceId,
    steps: DEFAULT_FLOW,
    initialStepData: {},
  };
}

export function createServiceFlowConfig(
  serviceId: number,
  steps: ServiceFlowStep[],
  initialStepData?: Record<string, unknown>
): ServiceFlowConfig {
  return {
    serviceId,
    steps,
    initialStepData: initialStepData ?? {},
  };
}
