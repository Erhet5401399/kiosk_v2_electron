import { useEffect, useMemo, useRef, useState } from "react";
import type { StepComponentProps } from "../../../types/steps";
import type {
  CheckQpayInvoiceResponse,
  CreateQpayInvoiceResponse,
} from "../../../../shared/types";
import { Button, useSnackbar } from "../../common";

const normalizeInvoice = (raw: unknown): CreateQpayInvoiceResponse | null => {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const payload =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const rawQrBase64 = String(
    payload.qrImageBase64 ||
      payload.qr_image_base64 ||
      payload.qr_image ||
      "",
  ).trim();
  const normalizedQrBase64 = rawQrBase64
    .replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "")
    .replace(/\s+/g, "");

  const invoiceId = String(
    payload.invoiceId || payload.invoice_id || payload.id || payload.invoice || "",
  ).trim();
  if (!invoiceId) return null;

  return {
    invoiceId,
    qrImageUrl: String(payload.qrImageUrl || payload.qr_image_url || "").trim() || undefined,
    qrImageBase64: normalizedQrBase64 || undefined,
    qrText:
      String(payload.qrText || payload.qr_text || payload.qr || payload.short_url || "")
        .trim() || undefined,
    status: String(payload.status || root.status || "").trim() || undefined,
    deeplink:
      String(payload.deeplink || payload.deep_link || payload.short_url || "")
        .trim() || undefined,
    amount:
      typeof payload.amount === "number"
        ? payload.amount
        : Number.isFinite(Number(payload.amount))
          ? Number(payload.amount)
          : undefined,
  };
};

function CardProcessing({ onNext }: { onNext: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onNext(), 3000);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div className="payment-processing">
      <div className="step-header">
        <div className="processing-spinner" style={{ marginBottom: 20 }} />
        <h1>Та картаа уншуулна уу...</h1>
        <p>Та ПОС төхөөрөмжид банкны картаа уншуулна уу.</p>
      </div>
    </div>
  );
}

function QpayProcessing({
  context,
  actions,
}: {
  context: StepComponentProps["context"];
  actions: StepComponentProps["actions"];
}) {
  const { showSuccess, showError, showInfo } = useSnackbar();
  const storedInvoice = useMemo(() => {
    const raw = context.stepData.qpayInvoice as CreateQpayInvoiceResponse | undefined;
    return raw?.invoiceId ? raw : null;
  }, [context.stepData.qpayInvoice]);

  const [invoice, setInvoice] = useState<CreateQpayInvoiceResponse | null>(storedInvoice);
  const [checkResult, setCheckResult] = useState<CheckQpayInvoiceResponse | null>(null);
  const [isCreating, setIsCreating] = useState(!storedInvoice);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createStartedRef = useRef(false);
  const currentInvoiceId = useMemo(
    () =>
      String(
        invoice?.invoiceId ||
        context.stepData.qpayInvoiceId ||
        "",
      ).trim(),
    [context.stepData.qpayInvoiceId, invoice?.invoiceId],
  );

  const createInvoice = async () => {
    if (!window.electron?.payment?.createQpayInvoice) {
      setError("Payment API is not available.");
      setIsCreating(false);
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const createdRaw = await window.electron.payment.createQpayInvoice({
        register: String(context.stepData.register_number || ""),
        tax_id: Number(context.stepData.service_id || context.stepData.tax_id || context.service.id || 0),
      });

      const created = normalizeInvoice(createdRaw);
      if (!created) {
        setError("Нэхэмжлэх үүсгэхэд алдаа гарлаа.");
        setIsCreating(false);
        return;
      }

      setInvoice(created);
      setIsCreating(false);
      actions.onUpdateStepData({
        qpayInvoice: created,
        qpayInvoiceId: created.invoiceId,
        qpayStatus: created.status ?? "CREATED",
      });
    } catch (e) {
      setError("Нэхэмжлэх үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.");
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (invoice?.invoiceId) return;
    if (createStartedRef.current) return;
    createStartedRef.current = true;
    void createInvoice();
  }, [invoice?.invoiceId]);

  const handleRetry = () => {
    if (isCreating) return;
    void createInvoice();
  };

  const handleCheck = async () => {
    if (!currentInvoiceId || !window.electron?.payment?.checkQpayInvoice) return;
    setIsChecking(true);
    setError(null);

    try {
      const result = await window.electron.payment.checkQpayInvoice({
        invoice_id: currentInvoiceId,
      });

      const paymentState = String(result?.data || "UNKNOWN").trim().toUpperCase();
      setCheckResult(result);
      // actions.onUpdateStepData({
      //   qpayCheck: result,
      //   qpayStatus: paymentState || "UNKNOWN",
      // });
      if (!result?.status) {
        showError("Төлбөр төлөгдөөгүй байна.");
        return;
      }
      if (paymentState === "PAID") {
        showSuccess("Төлбөр амжилттай төлөгдлөө.");
        actions.onNext();
      } else {
        showInfo(`Төлбөр төлөгдөөгүй байна.`);
      }
    } catch {
      setError("Төлбөр шалгахад алдаа гарлаа.");
      showError("Төлбөр шалгахад алдаа гарлаа.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="service-modal payment-processing-step">
      <div className="service-modal-body">
        <div className="step-header">
          <h1>QPAY төлбөр төлөх</h1>
          <p>Доорх QR кодыг банкны апп ашиглан төлбөр төлнө үү.</p>
        </div>

        {isCreating ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Түр хүлээнэ үү...</p>
          </div>
        ) : (
          <div className="qpay-payment-content">
            {invoice?.qrImageUrl ? (
              <img className="qpay-qr-image" src={invoice.qrImageUrl} alt="QPay QR" />
            ) : invoice?.qrImageBase64 ? (
              <img
                className="qpay-qr-image"
                src={`data:image/png;base64,${invoice.qrImageBase64}`}
                alt="QPay QR"
              />
            ) : (
              <div className="qpay-qr-fallback">
                <strong>QPAY</strong>
                <span>{invoice?.qrText || "Дахин оролдон уу"}</span>
              </div>
            )}

            <div className="qpay-meta">
              <div className="result-row">
                <span>Нэхэмжлэхийн дугаар</span>
                <strong>{invoice?.invoiceId || "-"}</strong>
              </div>
              <div className="result-row">
                <span>Төлбөрийн төлөв</span>
                <strong>{checkResult?.data || invoice?.status || "CREATED"}</strong>
              </div>
            </div>

            {error ? <p className="qpay-error-text">{error}</p> : null}
          </div>
        )}
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack} disabled={isCreating || isChecking}>
            Буцах
          </Button>
          {!currentInvoiceId ? (
            <Button onClick={handleRetry} disabled={isCreating}>
              {isCreating ? "Нэхэмлэх үүсгэж байна..." : "Нэхэмжлэх үүсгэх"}
            </Button>
          ) : (
            <Button onClick={handleCheck} disabled={isCreating || isChecking}>
              {isChecking ? "Төлбөр шалгаж байна..." : "Төлбөр шалгах"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PaymentProcessingStep({ context, actions }: StepComponentProps) {
  const method = String(context.paymentMethod || context.stepData.paymentMethod || "")
    .trim()
    .toLowerCase();

  if (method === "pos" || method === "card") {
    return <CardProcessing onNext={actions.onNext} />;
  }

  if (method === "qpay" || method === "qrcode") {
    return <QpayProcessing context={context} actions={actions} />;
  }

  return (
    <div className="service-modal">
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Төлбөрийн нөхцөл олдсонгүй</h1>
          <p>Та дахин оролдоно уу.</p>
        </div>
      </div>
      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}


