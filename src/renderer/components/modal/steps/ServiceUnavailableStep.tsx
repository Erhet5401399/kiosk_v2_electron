import type { StepComponentProps } from '../../../types/steps';
import { Button, StateCard } from '../../common';

export function ServiceUnavailableStep({ context, actions }: StepComponentProps) {
  const reason = String(context.stepData.unavailableReason || '').trim();

  return (
    <div
      className="service-modal"
    >
      <div className="service-modal-body">
        <StateCard
          title="Service Unavailable"
          description="This service cannot be used right now."
          detail={reason || 'The service flow is not configured correctly by backend.'}
          tone="warning"
        />
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button onClick={actions.onCancel}>Close</Button>
        </div>
      </div>
    </div>
  );
}




