import { useCallback, useEffect, useState } from 'react';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';
import { CheckIcon } from '../../common/CheckIcon';
import type { ParcelFee } from '../../../../shared/types';
import { formatPrice } from '../../../utils';

export function LandParcelFeesStep({ context, actions }: StepComponentProps) {
  const { stepData } = context;
  const selectedParcel = stepData.parcel_id as string | undefined;
  const [fees, setFees] = useState<ParcelFee[]>([]);
  const [selectedFee, setSelectedFee] = useState<ParcelFee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [_, setError] = useState<string | null>(null);

  const handleSelectFee = (fee: ParcelFee) => {
    setSelectedFee(fee)
  };

  const fetch = useCallback(async () => {
    if (!selectedParcel) {
      setFees([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!window.electron?.parcel?.list) {
        throw new Error('Electron IPC not available');
      }

      const response = await window.electron.parcel.feeList(selectedParcel);

      if (response) {
        setFees(response);
      } else {
        setError('Unknown error');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch parcels');
    } finally {
      setIsLoading(false);
    }
  }, [selectedParcel]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Газрын төлбөр төлөх</h1>
          <p>Таны сонгосон газрын төлбөрүүд</p>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Түр хүлээнэ үү...</p>
          </div>
        ) : fees.length ? (
          <div className="parcel-list land-parcel-list">
            {fees.map((fee) => (
              <button
                key={fee.id}
                className={`parcel-option land-parcel-option ${selectedFee?.id === fee.id ? 'selected' : ''}`}
                onClick={() => handleSelectFee(fee)}
              >
                <div className="parcel-icon">🗺️</div>
                <div className="parcel-info land-parcel-info">
                  <h3>{fee.imposition_year}</h3>

                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Нийт төлбөр</span>
                    <strong className="land-parcel-value">{formatPrice(fee.total_amount)}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Үлдэгдэл</span>
                    <strong className="land-parcel-value">{formatPrice(fee.remainning_amount)}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Year amount</span>
                    <strong className="land-parcel-value">{formatPrice(fee.year_amount)}</strong>
                  </div>
                </div>
                {selectedFee?.id === fee.id && (
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
              <strong>{selectedParcel}</strong> дугаартай газар дээр төлбөр олдсонгүй!
            </p>
          </div>
        )}
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button onClick={actions.onComplete}>
            Дуусгах
          </Button>
          {/* <Button onClick={actions.onNext} disabled={!selectedFee}>
            Үргэлжлүүлэх
          </Button> */}
        </div>
      </div>
    </div>
  );
}




