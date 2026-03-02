import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';
import { CheckIcon } from '../../common/CheckIcon';

const reasonList = [
  { id: '3', label: "Гэр, орон сууцны хашааны газар" },
]

export function ParcelReasonSelectStep({ context, actions }: StepComponentProps) {
  const { stepData } = context;
  const selectedReason = stepData.reason as string | undefined;

  const handleSelectReason = (value: string) => {
    actions.onUpdateStepData({
      reason: value
    });
  };

  return (
    <div
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Зориулалт сонгох</h1>
          <p>Таны регистрийн дугаартай холбоотой газрын нэгжүүд</p>
        </div>

        {reasonList.length ? (
          <div className="parcel-list land-parcel-list">
            {reasonList.map((reason) => (
              <button
                key={reason.id}
                className={`parcel-option land-parcel-option ${selectedReason === reason.id ? 'selected' : ''}`}
                onClick={() => handleSelectReason(reason.id)}
              >
                <div className="parcel-icon">🗺️</div>
                <div className="parcel-info land-parcel-info">
                  {/* <h3>{reason.id}</h3> */}

                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Зориулалт</span>
                    <strong className="land-parcel-value">{reason.label}</strong>
                  </div>
                </div>
                {selectedReason === reason.id && (
                  <div className="check-icon">
                    <CheckIcon />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="step-no-data">
            <p>
              <strong></strong> reason олдсонгүй!
            </p>
          </div>
        )}
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack}>
            Буцах
          </Button>
          <Button onClick={actions.onNext} disabled={!selectedReason}>
            Үргэлжлүүлэх
          </Button>
        </div>
      </div>
    </div>
  );
}




