import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StepComponentProps } from "../../../types/steps";
import type {
  CheckQpayInvoiceResponse,
  CreateQpayInvoiceResponse,
} from "../../../../shared/types";
import { Button } from "../../common";

const toAmount = (value: string | number): number => {
  if (typeof value === "number") return value;
  const numeric = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeInvoice = (raw: unknown): CreateQpayInvoiceResponse | null => {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as Record<string, unknown>;
  const invoiceId = String(
    payload.invoiceId || payload.invoice_id || payload.id || payload.invoice || "",
  ).trim();
  if (!invoiceId) return null;

  return {
    invoiceId,
    qrImageUrl: String(payload.qrImageUrl || payload.qr_image_url || "").trim() || undefined,
    qrImageBase64:
      String(payload.qrImageBase64 || payload.qr_image_base64 || "").trim() || undefined,
    qrText: String(payload.qrText || payload.qr_text || payload.qr || "").trim() || undefined,
    status: String(payload.status || "").trim() || undefined,
    deeplink: String(payload.deeplink || payload.deep_link || "").trim() || undefined,
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
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0, stiffness: 320, damping: 34 }} className="payment-processing">
      <div className="step-header">
        <div className="processing-spinner" style={{ marginBottom: 20 }} />
        <h1>Та картаа уншуулна уу...</h1>
        <p>Please wait</p>
      </div>
    </motion.div>
  );
}

function QpayProcessing({
  context,
  actions,
}: {
  context: StepComponentProps["context"];
  actions: StepComponentProps["actions"];
}) {
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
        paymentMethod: "qpay",
        serviceId: context.service.id,
        registerNumber: String(context.stepData.registerNumber || ""),
        amount: toAmount(context.service.price),
        metadata: { stepId: "payment-processing" },
      });

      const created = normalizeInvoice(createdRaw);
      if (!created) {
        setError("Failed to create invoice.");
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
    } catch {
      setError("Unable to create invoice. Please retry.");
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
    if (!invoice?.invoiceId || !window.electron?.payment?.checkQpayInvoice) return;
    setIsChecking(true);
    setError(null);

    try {
      const result = await window.electron.payment.checkQpayInvoice({
        paymentMethod: "qpay",
        invoiceId: invoice.invoiceId,
      });
      setCheckResult(result);
      actions.onUpdateStepData({
        qpayCheck: result,
        qpayStatus: result?.status ?? "UNKNOWN",
      });
      if (result?.paid) {
        actions.onNext();
      }
    } catch {
      setError("Unable to check payment.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0, stiffness: 320, damping: 34 }} className="service-modal payment-processing-step">
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Scan QPay QR to pay</h1>
          <p>After payment, click "Check payment".</p>
        </div>

        {isCreating ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Creating invoice...</p>
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
                <strong>QR payload</strong>
                <span>{invoice?.qrText || "No QR data"}</span>
              </div>
            )}

            <div className="qpay-meta">
              <div className="result-row">
                <span>Invoice</span>
                <strong>{invoice?.invoiceId || "-"}</strong>
              </div>
              <div className="result-row">
                <span>Status</span>
                <strong>{checkResult?.status || invoice?.status || "CREATED"}</strong>
              </div>
            </div>

            {error ? <p className="qpay-error-text">{error}</p> : null}
          </div>
        )}
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack} disabled={isCreating || isChecking}>
            Back
          </Button>
          {!invoice?.invoiceId ? (
            <Button onClick={handleRetry} disabled={isCreating}>
              {isCreating ? "Creating..." : "Retry invoice"}
            </Button>
          ) : (
            <Button onClick={handleCheck} disabled={isCreating || isChecking}>
              {isChecking ? "Checking..." : "Check payment"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
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
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0, stiffness: 320, damping: 34 }} className="service-modal">
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Payment method is required</h1>
          <p>Please go back and select a method.</p>
        </div>
      </div>
      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack}>
            Back
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
