import type { StepComponentProps } from '../../types/steps';
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
} from './steps';

type StepComponent = React.ComponentType<StepComponentProps & { onPrint?: () => void }>;

const STEP_COMPONENTS: Record<string, StepComponent> = {
  'registration-input': RegistrationInputStep,
  'land-parcel-select': LandParcelSelectStep,
  'document-type-select': DocumentTypeSelectStep,
  'boundary-verification': BoundaryVerificationStep,
  'ownership-check': OwnershipCheckStep,
  'payment-info': PaymentInfoStep,
  'payment-method': PaymentMethodStep,
  'payment-processing': PaymentProcessingStep,
  'success': SuccessStep,
  'print-options': PrintOptionsStep,
  'confirmation': ConfirmationStep,
};

interface StepRendererProps extends StepComponentProps {
  onPrint?: () => void;
}

export function StepRenderer({ context, actions, config, onPrint }: StepRendererProps) {
  const Component = STEP_COMPONENTS[config.id];

  if (!Component) {
    return (
      <div className="step-not-found">
        <h2>Step not found: {config.id}</h2>
        <p>This step component has not been implemented yet.</p>
      </div>
    );
  }

  return <Component context={context} actions={actions} config={config} onPrint={onPrint} />;
}

export function registerStepComponent(stepId: string, component: StepComponent): void {
  STEP_COMPONENTS[stepId] = component;
}

export function hasStepComponent(stepId: string): boolean {
  return stepId in STEP_COMPONENTS;
}
