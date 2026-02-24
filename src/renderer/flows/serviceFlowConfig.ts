import type { ServiceFlowConfig, ServiceFlowStep } from '../types/steps';

export function getServiceFlowConfig(serviceId: number): ServiceFlowConfig {
  return {
    serviceId,
    steps: [],
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
