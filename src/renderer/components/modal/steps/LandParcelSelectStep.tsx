import { motion } from 'framer-motion';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';
import { CheckIcon } from '../../common/CheckIcon';

const MOCK_PARCELS = [
  { id: 'P001', address: 'Улаанбаатар, СХД, 3-р хороо', area: '500 м²' },
  { id: 'P002', address: 'Улаанбаатар, БГД, 5-р хороо', area: '750 м²' },
  { id: 'P003', address: 'Улаанбаатар, ЧД, 1-р хороо', area: '300 м²' },
];

export function LandParcelSelectStep({ context, actions }: StepComponentProps) {
  const { stepData } = context;
  const selectedParcel = stepData.selectedParcel as string | undefined;

  const handleSelectParcel = (parcelId: string) => {
    actions.onUpdateStepData({ selectedParcel: parcelId });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Газрын нэгж талбар сонгох</h1>
          <p>Таны регистрийн дугаартай холбоотой газрын нэгжүүд</p>
        </div>

        <div className="parcel-list">
          {MOCK_PARCELS.map((parcel) => (
            <button
              key={parcel.id}
              className={`parcel-option ${selectedParcel === parcel.id ? 'selected' : ''}`}
              onClick={() => handleSelectParcel(parcel.id)}
            >
              <div className="parcel-icon">🗺️</div>
              <div className="parcel-info">
                <h3>{parcel.id}</h3>
                <span>{parcel.address}</span>
                <span className="parcel-area">{parcel.area}</span>
              </div>
              {selectedParcel === parcel.id && <div className="check-icon"><CheckIcon/></div>}
            </button>
          ))}
        </div>
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack}>
            Буцах
          </Button>
          <Button onClick={actions.onNext} disabled={!selectedParcel}>
            Үргэлжлүүлэх
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
