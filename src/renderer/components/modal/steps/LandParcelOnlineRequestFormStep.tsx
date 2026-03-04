import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';
import type { ParcelOnlineRequestFormField } from '../../../../shared/types';
import { useCallback, useEffect, useState } from 'react';

export function LandParcelOnlineRequestFormStep({ context, actions }: StepComponentProps) {
  const { stepData } = context;
  const registerNumber = (stepData.register_number as string) ?? '';
  const onlineRequestCode = (stepData.online_request_code as string) ?? '';
  const parcelId = stepData.parcel_id as string | undefined;
  const [formFields, setFormFields] = useState<ParcelOnlineRequestFormField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [_, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const normalizedRegister = String(registerNumber || "").trim();
    const normalizedParcel = String(parcelId || "").trim();
    const normalizedOnlineRequestCode = String(onlineRequestCode || "").trim();
    if (!normalizedRegister || !normalizedParcel || !normalizedOnlineRequestCode) {
      setFormFields([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!window.electron?.parcel?.onlineRequestForm) {
        throw new Error('Electron IPC not available');
      }

      const response = await window.electron.parcel.onlineRequestForm(normalizedRegister, normalizedParcel, onlineRequestCode);

      if (response) {
        setFormFields(response);
      } else {
        setError('Unknown error');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch form fields');
    } finally {
      setIsLoading(false);
    }
  }, [registerNumber, parcelId]);

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

        // TODO: DYNAMIC FORM FIELDS TO FILL
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack}>
            Буцах
          </Button>
          <Button onClick={() => {}}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
