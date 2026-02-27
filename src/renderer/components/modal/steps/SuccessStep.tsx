import { useState } from 'react';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';

interface SuccessStepExtraProps {
  onPrint?: () => Promise<{ success: boolean; error?: string }>;
}

type PrintState = 'idle' | 'printing' | 'success' | 'error';

export function SuccessStep({
  context,
  actions,
  onPrint,
}: StepComponentProps & SuccessStepExtraProps) {
  const { service } = context;
  const [printState, setPrintState] = useState<PrintState>('idle');
  const [printMessage, setPrintMessage] = useState('');

  const isPrinting = printState === 'printing';

  const handlePrint = async () => {
    if (!onPrint || isPrinting) return;

    setPrintState('printing');
    setPrintMessage('Баримт хэвлэх хүсэлтийг илгээж байна...');

    const result = await onPrint();

    if (!result.success) {
      setPrintState('error');
      setPrintMessage(result.error || 'Хэвлэх үед алдаа гарлаа.');
      return;
    }

    setPrintState('success');
    setPrintMessage('Амжилттай хэвлэгдлээ.');
    // window.setTimeout(() => {
    //   actions.onComplete();
    // }, 1200);
  };

  return (
    <div
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <div
            className="success-icon"
            aria-hidden="true"
          >
            <svg
              className="success-icon-check"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M5.5 12.5L10 17L18.5 8.5"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1>Төлбөр амжилттай</h1>
          <p>Таны баримт бэлэн боллоо</p>
          <p className="success-service-name">{service.name}</p>
          {printState !== 'idle' && (
            <p
              style={{
                marginTop: '10px',
                color: printState === 'error' ? '#dc2626' : '#14532d',
                fontWeight: 600,
              }}
            >
              {printMessage}
            </p>
          )}
        </div>
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onComplete} disabled={isPrinting}>
            Дуусгах
          </Button>
          <Button onClick={handlePrint} disabled={isPrinting || printState === 'success'}>
            {isPrinting ? 'Хэвлэж байна...' : printState === 'error' ? 'Дахин хэвлэх' : 'Хэвлэх'}
          </Button>
        </div>
      </div>
    </div>
  );
}




