import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';
import { CheckIcon } from '../../common/CheckIcon';
import type { ParcelOnlineRequest } from '../../../../shared/types';
import { useCallback, useEffect, useState } from 'react';

export function LandParcelOnlineRequestFormStep({ context, actions }: StepComponentProps) {
  const { stepData } = context;
  const registerNumber = (stepData.register_number as string) ?? '';
  const selectedParcel = stepData.parcel_id as string | undefined;
  const selectedOnlineRequestCode = stepData.online_request_code as number | undefined;
  const [onlineRequest, setOnlineRequest] = useState<ParcelOnlineRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [_, setError] = useState<string | null>(null);

  const handleSelect = (value: ParcelOnlineRequest['appTypeList'][0]) => {
    actions.onUpdateStepData({
      online_request_code: value.code,
    });
  };

  const fetch = useCallback(async () => {
    const normalizedRegister = String(registerNumber || "").trim();
    const normalizedParcel = String(selectedParcel || "").trim();
    if (!normalizedRegister || !normalizedParcel) {
      setOnlineRequest(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!window.electron?.parcel?.onlineRequestList) {
        throw new Error('Electron IPC not available');
      }

      const response = await window.electron.parcel.onlineRequestList(normalizedRegister, normalizedParcel);

      if (response) {
        setOnlineRequest(response);
      } else {
        setError('Unknown error');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch parcels');
    } finally {
      setIsLoading(false);
    }
  }, [registerNumber, selectedParcel]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Цахим хүсэлт илгээх</h1>
          <p>Таны илгээж болох цахим хүсэлтүүд</p>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Түр хүлээнэ үү...</p>
          </div>
        ) : onlineRequest?.appTypeList?.length ? (
          <div className="parcel-list land-parcel-list">
            {onlineRequest.appTypeList.map((item) => (
              <button
                key={item.code}
                className={`parcel-option land-parcel-option ${selectedOnlineRequestCode === item.code ? 'selected' : ''}`}
                onClick={() => handleSelect(item)}
              >
                <div className="parcel-icon"></div>
                <div className="parcel-info land-parcel-info">
                  <h3>{item.description}</h3>
                </div>
                {selectedOnlineRequestCode === item.code && (
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
              <strong>{registerNumber}</strong> регистрийн дугаар дээр газар олдсонгүй!
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
    </div>
  );
}
