import type { ComponentType } from 'react';
import type {
  StepComponentProps,
  StepConfig,
  StepContext,
  StepValidation,
} from '../../types/steps';
import {
  RegistrationInputStep,
  PaymentMethodStep,
  PaymentProcessingStep,
  SuccessStep,
  LandParcelSelectStep,
  DocumentTypeSelectStep,
  OwnershipCheckStep,
  BoundaryVerificationStep,
  PaymentInfoStep,
  ConfirmationStep,
  PrintOptionsStep,
} from '../../components/modal/steps';

export type StepComponent = ComponentType<StepComponentProps & { onPrint?: () => void }>;

export type StepDefinition = StepConfig & {
  component: StepComponent;
};

export const STEP_DEFINITIONS: Record<string, StepDefinition> = {
  'registration-input': {
    id: 'registration-input',
    title: 'Регистрийн мэдээлэл',
    component: RegistrationInputStep,
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
    component: LandParcelSelectStep,
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
    component: DocumentTypeSelectStep,
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
    component: BoundaryVerificationStep,
  },
  'ownership-check': {
    id: 'ownership-check',
    title: 'Эзэмших эрх шалгах',
    component: OwnershipCheckStep,
  },
  'payment-info': {
    id: 'payment-info',
    title: 'Төлбөрийн мэдээлэл',
    component: PaymentInfoStep,
  },
  'payment-method': {
    id: 'payment-method',
    title: 'Төлбөрийн хэлбэр',
    component: PaymentMethodStep,
  },
  'payment-processing': {
    id: 'payment-processing',
    title: 'Төлбөр боловсруулж байна',
    component: PaymentProcessingStep,
  },
  success: {
    id: 'success',
    title: 'Амжилттай',
    component: SuccessStep,
  },
  'print-options': {
    id: 'print-options',
    title: 'Хэвлэх сонголт',
    component: PrintOptionsStep,
  },
  confirmation: {
    id: 'confirmation',
    title: 'Баталгаажуулалт',
    component: ConfirmationStep,
  },
};

export function getStepDefinition(stepId: string): StepDefinition {
  const definition = STEP_DEFINITIONS[stepId];
  if (!definition) {
    throw new Error(`Step "${stepId}" not found in definitions`);
  }
  return definition;
}

export function getStepComponent(stepId: string): StepComponent | undefined {
  return STEP_DEFINITIONS[stepId]?.component;
}

export function hasStepComponent(stepId: string): boolean {
  return stepId in STEP_DEFINITIONS && Boolean(STEP_DEFINITIONS[stepId]?.component);
}

export function registerStepDefinition(definition: StepDefinition): void {
  STEP_DEFINITIONS[definition.id] = definition;
}

export function registerStepComponent(stepId: string, component: StepComponent): void {
  const existing = STEP_DEFINITIONS[stepId];
  if (!existing) {
    throw new Error(`Cannot register component for unknown step "${stepId}". Register definition first.`);
  }
  STEP_DEFINITIONS[stepId] = {
    ...existing,
    component,
  };
}
