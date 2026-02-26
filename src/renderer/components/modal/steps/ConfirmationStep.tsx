import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';

export function ConfirmationStep({ context, actions }: StepComponentProps) {
  const { service, stepData } = context;

  return (
    <div
      className="service-modal confirmation-step"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Баталгаажуулалт</h1>
          <p>Мэдээллийг шалгаад баталгаажуулна уу</p>
        </div>

        <div className="confirmation-content">
          <div className="confirmation-section">
            <h3>Үйлчилгээний мэдээлэл</h3>
            <div className="info-row">
              <span>Үйлчилгээ:</span>
              <strong>{service.name}</strong>
            </div>
            <div className="info-row">
              <span>Үнэ:</span>
              <strong>{service.price}</strong>
            </div>
          </div>

          <div className="confirmation-section">
            <h3>Хэрэглэгчийн мэдээлэл</h3>
            <div className="info-row">
              <span>Регистр:</span>
              <strong>{String(stepData.register_number || '')}</strong>
            </div>
            {stepData.parcel_id ? (
              <div className="info-row">
                <span>Газрын нэгж:</span>
                <strong>{String(stepData.parcel_id)}</strong>
              </div>
            ) : null}
            {stepData.documentType ? (
              <div className="info-row">
                <span>Бичиг баримт:</span>
                <strong>{String(stepData.documentType)}</strong>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack}>
            Буцах
          </Button>
          <Button onClick={actions.onNext}>Баталгаажуулах</Button>
        </div>
      </div>
    </div>
  );
}






