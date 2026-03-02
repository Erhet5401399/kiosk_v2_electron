import { useCallback, useEffect, useState } from 'react';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';
import type { ParcelRequest } from '../../../../shared/types';

export function RequestCheckStep({ context, actions }: StepComponentProps) {
  const { stepData } = context;
  const registerNumber = (stepData.register_number as string) ?? '';
  const [requests, setRequests] = useState<ParcelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [_, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const normalizedRegister = String(registerNumber || "").trim();
    if (!normalizedRegister) {
      setRequests([]);
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

      const response = await window.electron.parcel.requestList(normalizedRegister);

      if (response) {
        setRequests(response);
      } else {
        setError('Unknown error');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch parcels');
    } finally {
      setIsLoading(false);
    }
  }, [registerNumber]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Хүсэлт шалгах</h1>
          <p>Таны регистрийн дугаар дээрх хүсэлтүүд</p>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Түр хүлээнэ үү...</p>
          </div>
        ) : requests.length ? (
          <div className="parcel-list land-parcel-list">
            {requests.map((request) => (
              <button
                key={request.app_id}
                className={`parcel-option land-parcel-option`}
                onClick={() => () => {}}
              >
                <div className="parcel-icon">🗺️</div>
                <div className="parcel-info land-parcel-info">
                  <h3>Хүсэлтийн дугаар: {request.app_no}</h3>

                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Хүсэлтийн төрөл</span>
                    <strong className="land-parcel-value">{request.app_type_desc}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Хүсэлтийн тайлбар</span>
                    <strong className="land-parcel-value">{request.req_description}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Нэгж талбарын дугаар</span>
                    <strong className="land-parcel-value">{request.parcel_id}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Талбайн хэмжээ (м²)</span>
                    <strong className="land-parcel-value">{request.area_m2 || ""}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Аймаг /Нийслэл/</span>
                    <strong className="land-parcel-value">{request.au1_name}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Сум /Дүүрэг/</span>
                    <strong className="land-parcel-value">{request.au2_name}</strong>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="step-no-data">
            <p>
              <strong>{registerNumber}</strong> регистрийн дугаар дээр хүсэлт байхгүй байна!
            </p>
          </div>
        )}
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack}>
            Буцах
          </Button>
          <Button onClick={actions.onNext}>
            Үргэлжлүүлэх
          </Button>
        </div>
      </div>
    </div>
  );
}




