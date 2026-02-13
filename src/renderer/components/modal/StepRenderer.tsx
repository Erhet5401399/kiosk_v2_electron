import type { StepComponentProps } from '../../types/steps';
import { getStepComponent } from '../../flows/steps/definitions';

interface StepRendererProps extends StepComponentProps {
  onPrint?: () => void;
}

export function StepRenderer({ context, actions, config, onPrint }: StepRendererProps) {
  const Component = getStepComponent(config.id);

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
export { registerStepComponent, hasStepComponent } from '../../flows/steps/definitions';
