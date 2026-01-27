import type { ServiceFlowConfig } from '../../types/steps';

const DEFAULT_PAID_FLOW: string[] = [
  'registration-input',
  'payment-method',
  'payment-processing',
  'success',
];

const DEFAULT_FREE_FLOW: string[] = [
  'registration-input',
  'confirmation',
  'success',
];

export const SERVICE_FLOW_CONFIGS: Record<number, ServiceFlowConfig> = {
  1: {
    serviceId: 1,
    steps: [
      'registration-input',
      'land-parcel-select',
      'payment-method',
      'payment-processing',
      'success',
    ],
    initialStepData: {
      mapType: 'cadastral',
    },
  },

  2: {
    serviceId: 2,
    steps: [
      'registration-input',
      'land-parcel-select',
      'boundary-verification',
      'payment-method',
      'payment-processing',
      'success',
    ],
    initialStepData: {
      requiresBoundaryCheck: true,
    },
  },

  3: {
    serviceId: 3,
    steps: [
      'registration-input',
      'document-type-select',
      'payment-method',
      'payment-processing',
      'success',
      'print-options',
    ],
    initialStepData: {
      documentCategory: 'cadastral-reference',
    },
  },

  4: {
    serviceId: 4,
    steps: [
      'registration-input',
      'ownership-check',
      'confirmation',
      'success',
    ],
    initialStepData: {},
  },

  5: {
    serviceId: 5,
    steps: [
      'registration-input',
      'payment-info',
      'confirmation',
      'success',
    ],
    initialStepData: {},
  },

  6: {
    serviceId: 6,
    steps: [
      'registration-input',
      'document-type-select',
      'print-options',
      'payment-method',
      'payment-processing',
      'success',
    ],
    initialStepData: {
      printCategory: 'cadastral-documents',
    },
  },

  7: {
    serviceId: 7,
    steps: [
      'registration-input',
      'ownership-check',
      'payment-method',
      'payment-processing',
      'success',
      'print-options',
    ],
    initialStepData: {
      documentType: 'certificate',
    },
  },
};

export function getServiceFlowConfig(serviceId: number): ServiceFlowConfig {
  const config = SERVICE_FLOW_CONFIGS[serviceId];
  if (config) {
    return config;
  }

  const isFree = serviceId === 4 || serviceId === 5;
  return {
    serviceId,
    steps: isFree ? DEFAULT_FREE_FLOW : DEFAULT_PAID_FLOW,
    initialStepData: {},
  };
}

export function createServiceFlowConfig(
  serviceId: number,
  steps: string[],
  initialStepData?: Record<string, unknown>
): ServiceFlowConfig {
  return {
    serviceId,
    steps,
    initialStepData: initialStepData ?? {},
  };
}
