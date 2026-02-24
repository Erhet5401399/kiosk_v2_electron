import type { StepComponentProps } from '../../types/steps';
import { getStepComponent } from '../../flows';
import { StateCard } from '../common';

interface StepRendererProps extends StepComponentProps {
  onPrint?: () => Promise<{ success: boolean; error?: string }>;
}

export function StepRenderer({ context, actions, config, onPrint }: StepRendererProps) {
  const Component = getStepComponent(config.id);

  if (!Component) {
    return (
      <div className="service-modal">
        <div className="service-modal-body">
          <StateCard
            title="Step not available"
            description="This step is not implemented in this kiosk version."
            detail={`Step id: ${config.id}`}
            tone="warning"
          />
        </div>
      </div>
    );
  }

  return <Component context={context} actions={actions} config={config} onPrint={onPrint} />;
}

export { registerStepComponent, hasStepComponent } from '../../flows';
