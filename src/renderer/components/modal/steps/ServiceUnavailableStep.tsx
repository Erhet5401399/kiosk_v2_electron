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
          title="Үйлчилгээ идэвхгүй байна"
          description="Энэ үйлчилгээг одоогоор ашиглах боломжгүй байна."
          detail={reason}
          tone="warning"
        />
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button onClick={actions.onCancel}>Буцах</Button>
        </div>
      </div>
    </div>
  );
}




