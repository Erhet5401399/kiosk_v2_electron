import { useCallback, useEffect, useState } from 'react';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';
import type { ParcelApplication } from '../../../../shared/types';

export function ApplicationCheckStep({ context, actions }: StepComponentProps) {
  const { stepData } = context;
  const registerNumber = (stepData.register_number as string) ?? '';
  const [applications, setApplications] = useState<ParcelApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [_, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const normalizedRegister = String(registerNumber || "").trim();
    if (!normalizedRegister) {
      setApplications([]);
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

      const response = await window.electron.parcel.applicationList(normalizedRegister);

      if (response) {
        setApplications(response);
      } else {
        setError('Unknown error');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch');
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
          <h1>Өргөдөл шалгах</h1>
          <p>Таны регистрийн дугаар дээрх өргөдлүүд</p>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Түр хүлээнэ үү...</p>
          </div>
        ) : applications.length ? (
          <div className="parcel-list land-parcel-list">
            {applications.map((application) => (
              <button
                key={application.app_id}
                className={`parcel-option land-parcel-option`}
                onClick={() => () => {}}
              >
                <div className="parcel-icon">🗺️</div>
                <div className="parcel-info land-parcel-info">
                  <h3>Өргөдлийн дугаар: {application.app_no || "-"}</h3>

                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Эрхийн төрөл</span>
                    <strong className="land-parcel-value">{application.right_type_desc || "-"}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Өргөдлийн төлөв</span>
                    <strong className="land-parcel-value">{application.status_desc || "-"}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Нэгж талбарын дугаар</span>
                    <strong className="land-parcel-value">{application.parcel || "-"}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Аймаг /Нийслэл/</span>
                    <strong className="land-parcel-value">{application.au1_name || "-"}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Сум /Дүүрэг/</span>
                    <strong className="land-parcel-value">{application.au2_name || "-"}</strong>
                  </div>
                  <div className="land-parcel-meta-row">
                    <span className="land-parcel-label">Өргөдлийн огноо</span>
                    <strong className="land-parcel-value">{application.app_timestamp || "-"}</strong>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="step-no-data">
            <p>
              <strong>{registerNumber}</strong> регистрийн дугаар дээр өргөдөл байхгүй байна!
            </p>
          </div>
        )}
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button onClick={actions.onComplete}>
            Дуусгах
          </Button>
          {/* <Button onClick={actions.onNext}>
            Үргэлжлүүлэх
          </Button> */}
        </div>
      </div>
    </div>
  );
}




