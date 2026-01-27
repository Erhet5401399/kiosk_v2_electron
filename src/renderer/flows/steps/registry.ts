import type { StepConfig, StepContext, StepValidation } from '../../types/steps';

export const STEP_REGISTRY: Record<string, StepConfig> = {
  'registration-input': {
    id: 'registration-input',
    title: 'Регистрийн мэдээлэл',
    validate: (context: StepContext): StepValidation => {
      const { stepData } = context;
      const registerNumber = stepData.registerNumber as string;
      if (!registerNumber || registerNumber.length < 10) {
        return { isValid: false, errorMessage: 'Регистрийн дугаараа зөв оруулна уу.' };
      }
      return { isValid: true };
    },
  },

  'land-parcel-select': {
    id: 'land-parcel-select',
    title: 'Газрын нэгж талбар сонгох',
    validate: (context: StepContext): StepValidation => {
      const { stepData } = context;
      if (!stepData.selectedParcel) {
        return { isValid: false, errorMessage: 'Газрын нэгж талбар сонгоно уу.' };
      }
      return { isValid: true };
    },
  },

  'document-type-select': {
    id: 'document-type-select',
    title: 'Бичиг баримтын төрөл',
    validate: (context: StepContext): StepValidation => {
      const { stepData } = context;
      if (!stepData.documentType) {
        return { isValid: false, errorMessage: 'Бичиг баримтын төрөл сонгоно уу.' };
      }
      return { isValid: true };
    },
  },

  'boundary-verification': {
    id: 'boundary-verification',
    title: 'Хил хязгаар баталгаажуулах',
  },

  'ownership-check': {
    id: 'ownership-check',
    title: 'Эзэмших эрх шалгах',
  },

  'payment-info': {
    id: 'payment-info',
    title: 'Төлбөрийн мэдээлэл',
  },

  'payment-method': {
    id: 'payment-method',
    title: 'Төлбөрийн хэлбэр',
  },

  'payment-processing': {
    id: 'payment-processing',
    title: 'Төлбөр боловсруулж байна',
  },

  'success': {
    id: 'success',
    title: 'Амжилттай',
  },

  'print-options': {
    id: 'print-options',
    title: 'Хэвлэх сонголт',
  },

  'confirmation': {
    id: 'confirmation',
    title: 'Баталгаажуулалт',
  },
};

export function getStepConfig(stepId: string): StepConfig {
  const config = STEP_REGISTRY[stepId];
  if (!config) {
    throw new Error(`Step "${stepId}" not found in registry`);
  }
  return config;
}

export function registerStep(config: StepConfig): void {
  STEP_REGISTRY[config.id] = config;
}
