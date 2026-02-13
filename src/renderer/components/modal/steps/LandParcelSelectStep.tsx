import { motion } from 'framer-motion';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';
import { CheckIcon } from '../../common/CheckIcon';
import { useParcels } from '../../../hooks';

export function LandParcelSelectStep({ context, actions }: StepComponentProps) {
  const { stepData } = context;
  const registerNumber = (stepData.registerNumber as string) ?? '';
  const selectedParcel = stepData.selectedParcel as string | undefined;

  const { parcels, isLoading } = useParcels({ register: registerNumber });

  const handleSelectParcel = (parcelId: string) => {
    actions.onUpdateStepData({ selectedParcel: parcelId });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', bounce: 0, stiffness: 320, damping: 34 }}
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Газрын нэгж талбар сонгох</h1>
          <p>Таны регистрийн дугаартай холбоотой газрын нэгжүүд</p>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Түр хүлээнэ үү...</p>
          </div>
        ) : parcels.length ? (
          <div className="parcel-list land-parcel-list">
            {parcels.map((parcel) => (
              <button
                key={parcel.parcel}
                className={`parcel-option land-parcel-option ${selectedParcel === parcel.parcel ? 'selected' : ''}`}
                onClick={() => handleSelectParcel(parcel.parcel)}
              >
                <div className="parcel-icon">🗺️</div>
                <div className="parcel-info land-parcel-info">
                  <h3>Нэгж талбарын дугаар: {parcel.parcel}</h3>

                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Төлөв</span>
                    <strong className="land-parcel-value">{parcel.status_desc}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Өргөдөл</span>
                    <strong className="land-parcel-value">{parcel.app_type_name}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Талбайн хэмжээ (м²)</span>
                    <strong className="land-parcel-value">{parcel.area_m2}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Аймаг /Нийслэл/</span>
                    <strong className="land-parcel-value">{parcel.au1_name}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Сум /Дүүрэг/</span>
                    <strong className="land-parcel-value">{parcel.au2_name}</strong>
                  </div>
                </div>
                {selectedParcel === parcel.parcel && (
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
              <strong>{registerNumber}</strong> регистрийн дугаар дээр өмчилсөн газар олдсонгүй!
            </p>
          </div>
        )}
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
