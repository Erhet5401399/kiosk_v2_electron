import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { StepComponentProps } from "../../../types/steps";
import { Button, StateCard } from "../../common";
import { buildDataUriFromBase64, detectBase64ContentKind } from "../../../utils";

export function CadastralMapStep({ context, actions }: StepComponentProps) {
  const selectedParcel = String(context.stepData.selectedParcel || "").trim();
  const existingBase64 = String(context.stepData.documentBase64 || "").trim();

  const [base64, setBase64] = useState(existingBase64);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!selectedParcel) {
        setError("Нэгж талбар сонгогдоогүй байна.");
        return;
      }

      if (existingBase64) {
        setBase64(existingBase64);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await window.electron.service.cadastralMap(selectedParcel);
        if (!active) return;

        const normalized = String(response || "").trim();
        if (!normalized) {
          setError("Кадастрын зураг олдсонгүй.");
          setBase64("");
          return;
        }

        setBase64(normalized);
        actions.onUpdateStepData({
          documentBase64: normalized,
        });
      } catch (err) {
        if (!active) return;
        setBase64("");
        setError((err as Error)?.message || "Кадастрын зураг ачаалахад алдаа гарлаа.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [actions, existingBase64, selectedParcel]);

  const dataUri = useMemo(() => buildDataUriFromBase64(base64), [base64]);
  const previewKind = useMemo(() => detectBase64ContentKind(base64), [base64]);
  const previewSrc = useMemo(() => {
    if (previewKind === "pdf") {
      return `${dataUri}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
    }
    return dataUri;
  }, [dataUri, previewKind]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", bounce: 0, stiffness: 320, damping: 34 }}
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Кадастрын зураг</h1>
          <p>Сонгосон нэгж талбарын кадастрын зургийг шалгана уу.</p>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Түр хүлээнэ үү...</p>
          </div>
        ) : error ? (
          <StateCard
            title="Кадастрын зураг олдсонгүй"
            description="Баримт татаж чадсангүй."
            detail={error}
            tone="warning"
          />
        ) : !base64 ? (
          <StateCard
            title="Баримт хоосон байна"
            description="Сонгосон нэгж талбарт баримтын өгөгдөл олдсонгүй."
            tone="warning"
          />
        ) : (
          <div className="result-details">
            {previewKind === "pdf" || previewKind === "html" ? (
              <iframe
                title="Cadastral Map"
                src={previewSrc}
                style={{ width: "100%", height: "520px", border: "none", borderRadius: "12px" }}
              />
            ) : (
              <img
                src={previewSrc}
                alt="Cadastral Map"
                style={{ width: "100%", maxHeight: "520px", objectFit: "contain", borderRadius: "12px" }}
              />
            )}
          </div>
        )}
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack}>
            Буцах
          </Button>
          <Button onClick={actions.onNext} disabled={!base64 || Boolean(error)}>
            Үргэлжлүүлэх
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
