import type { ComponentType } from 'react';
import type {
  StepComponentProps,
  StepConfig,
  StepContext,
  StepValidation,
} from '../types/steps';
import {
  PaymentMethodStep,
  PaymentProcessingStep,
  SuccessStep,
  LandParcelSelectStep,
  OwnershipCheckStep,
  PaymentInfoStep,
  ServiceUnavailableStep,
  DocumentPreviewStep,
  AuthStep,
} from '../components/modal/steps';
import { RequestCheckStep } from '../components/modal/steps/RequestCheckStep';

export type StepComponent = ComponentType<
  StepComponentProps & { onPrint?: () => Promise<{ success: boolean; error?: string }> }
>;

export type StepDefinition = StepConfig & {
  component: StepComponent;
};

export const STEP_DEFINITIONS: Record<string, StepDefinition> = {
  "auth-gate": {
    id: "auth-gate",
    title: "Нэвтрэх",
    component: AuthStep,
    validate: (context: StepContext): StepValidation => {
      if (context.stepData.user_authenticated === true) {
        return { isValid: true };
      }
      return { isValid: false, errorMessage: "Please complete authentication." };
    },
  },
  'land-parcel-select': {
    id: 'land-parcel-select',
    title: 'Нэгж талбар сонгох',
    component: LandParcelSelectStep,
    validate: (context: StepContext): StepValidation => {
      const { stepData } = context;
      if (!stepData.parcel_id) {
        return { isValid: false, errorMessage: 'Газрын нэгж талбар сонгоно уу.' };
      }
      return { isValid: true };
    },
  },
  'request-check': {
    id: 'request-check',
    title: 'Хүсэлт шалгах',
    component: RequestCheckStep,
  },
  'document-preview': {
    id: 'document-preview',
    title: 'Баримт харах',
    component: DocumentPreviewStep,
    validate: (context: StepContext): StepValidation => {
      const base64 = String(context.stepData.documentBase64 || "").trim();
      if (!base64) {
        return { isValid: false, errorMessage: 'Something wrong.' };
      }
      return { isValid: true };
    },
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
  'success': {
    id: 'success',
    title: 'Амжилттай',
    component: SuccessStep,
  },
  'service-unavailable': {
    id: 'service-unavailable',
    title: 'Идэвхгүй үйлчилгээ',
    component: ServiceUnavailableStep,
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

export function hasStepDefinition(stepId: string): boolean {
  return stepId in STEP_DEFINITIONS;
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

