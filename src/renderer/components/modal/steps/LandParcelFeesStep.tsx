import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';
import type { ParcelFee, ParcelFeeInvoice } from '../../../../shared/types';
import { formatPrice } from '../../../utils';

export function LandParcelFeesStep({ context, actions }: StepComponentProps) {
  const { stepData } = context;
  const selectedParcel = stepData.parcel_id as string | undefined;
  const [fees, setFees] = useState<ParcelFee[]>([]);
  const [qrInvoice, setQrInvoice] = useState<ParcelFeeInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectInvoice = (fee: ParcelFee, invoice: ParcelFeeInvoice) => {
    setQrInvoice(invoice);
    actions.onUpdateStepData({
      selectedFee: fee,
      selectedFeeId: fee.id,
      selectedInvoice: invoice,
      selectedInvoiceId: invoice.id,
      qpayQrImage: invoice.qpay_qrimage || null,
    });
  };

  const invoiceQrSrc = useMemo(() => {
    const raw = String(qrInvoice?.qpay_qrimage || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw) || /^data:image\//i.test(raw)) return raw;
    const normalized = raw.replace(/\s+/g, '');
    return normalized ? `data:image/png;base64,${normalized}` : '';
  }, [qrInvoice?.qpay_qrimage]);

  const fetchFees = useCallback(async () => {
    if (!selectedParcel) {
      setFees([]);
      setQrInvoice(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!window.electron?.parcel?.feeList) {
        throw new Error('Electron IPC not available');
      }

      const response = await window.electron.parcel.feeList(selectedParcel);

      if (response) {
        setFees(response);
        setQrInvoice(null);
      } else {
        setError('Unknown error');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch fees');
    } finally {
      setIsLoading(false);
    }
  }, [selectedParcel]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  return (
    <div className="service-modal">
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Газрын төлбөр төлөх</h1>
          <p>Таны сонгосон газар дээрх төлбөрүүд.</p>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Түр хүлээнэ үү...</p>
          </div>
        ) : fees.length ? (
          <div className="parcel-list land-parcel-list">
            {fees.map((fee) => (
              <div key={fee.id} className="parcel-option land-parcel-option fee-with-invoices">
                <div className="parcel-icon" />
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
                    <span className="land-parcel-label">Жилийн төлбөр</span>
                    <strong className="land-parcel-value">{formatPrice(fee.year_amount)}</strong>
                  </div>

                  <div className="fee-card-invoices">
                    <h4 className="fee-card-invoices-title">Нэхэмжлэхүүд</h4>
                    {fee.invoices?.length ? (
                      fee.invoices.map((invoice) => (
                        <div key={invoice.id} className="fee-invoice-item">
                          <div className="fee-invoice-row">
                            <span className="fee-invoice-label">Төлөх дүн</span>
                            <strong className="fee-invoice-value">{formatPrice(invoice.payable_amount)}</strong>
                          </div>
                          <div className="fee-invoice-row">
                            <span className="fee-invoice-label">Төлөв</span>
                            <strong className="fee-invoice-value">{invoice.status_name || '-'}</strong>
                          </div>
                          <div className="fee-invoice-row">
                            <span className="fee-invoice-label">Тайлбар</span>
                            <strong className="fee-invoice-value">{invoice.description || '-'}</strong>
                          </div>
                          <div className="fee-invoice-actions">
                            <Button className="invoice-pay-btn" onClick={() => handleSelectInvoice(fee, invoice)}>
                              Нэхэмжлэхийн төлбөр төлөх
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="qpay-pending-text">Нэхэмжлэх байхгүй байна.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="step-no-data">
            <p>
              <strong>{selectedParcel}</strong> дугаартай газар дээр төлбөр үүсээгүй байна.
            </p>
          </div>
        )}

        {error ? <p className="qpay-error-text">{error}</p> : null}

        {qrInvoice ? (
          <div className="fee-qr-popup-backdrop">
            <div className="fee-qr-popup" onClick={(e) => e.stopPropagation()}>
              <h3 className="fee-invoices-title">Төлбөр төлөх</h3>
              {invoiceQrSrc ? (
                <img className="qpay-qr-image" src={invoiceQrSrc} alt="Invoice QPay QR" />
              ) : (
                <p className="qpay-pending-text">Энэ нэхэмжлэлд QPay QR код алга.</p>
              )}
              <div className="qpay-meta">
                <div className="result-row">
                  <span>Нэхэмжлэхийн дугаар</span>
                  <strong>{qrInvoice.invoice_no || '-'}</strong>
                </div>
                <div className="result-row">
                  <span>Төлөв</span>
                  <strong>{qrInvoice.status_name || '-'}</strong>
                </div>
                <div className="result-row">
                  <span>Улирал</span>
                  <strong>{qrInvoice.description || '-'}</strong>
                </div>
              </div>
              <div className="fee-qr-popup-actions">
                <Button variant="secondary" onClick={() => setQrInvoice(null)}>
                  Хаах
                </Button>
                {/* <Button onClick={() => {}} disabled>
                  Төлбөр шалгах
                </Button> */}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button onClick={actions.onComplete} variant='secondary'>Дуусгах</Button>
        </div>
      </div>
    </div>
  );
}
