import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { StepComponentProps } from "../../../types/steps";
import { Button, StateCard } from "../../common";
import { buildDataUriFromBase64, detectBase64ContentKind } from "../../../utils";

export function DocumentPreviewStep({ context, actions, config }: StepComponentProps) {
  const existingBase64 = String(context.stepData.documentBase64 || "").trim();
  const existingRequestKey = String(context.stepData.documentRequestKey || "").trim();
  const documentConfig = config.document;

  const resolvedRequest = useMemo(() => {
    if (!documentConfig?.endpoint) {
      return { request: null, missing: ["endpoint"] as string[] };
    }

    const requestedParams = documentConfig.params || [];
    const params: Record<string, string> = {};
    const missing: string[] = [];

    requestedParams.forEach((paramKey) => {
      const key = String(paramKey || "").trim();
      if (!key) return;
      const rawValue = context.stepData[key];
      const normalizedValue = String(rawValue ?? "").trim();

      if (!normalizedValue) {
        missing.push(key);
        return;
      }

      params[key] = normalizedValue;
    });

    const request = {
      endpoint: documentConfig.endpoint,
      method: documentConfig.method || "POST",
      params,
    };

    return { request, missing };
  }, [context.stepData, documentConfig]);

  const requestKey = useMemo(() => {
    if (!resolvedRequest.request) return "";
    return JSON.stringify(resolvedRequest.request);
  }, [resolvedRequest.request]);

  const [base64, setBase64] = useState(existingBase64);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!documentConfig?.endpoint) {
        setBase64("");
        setError("Document endpoint is not configured.");
        return;
      }

      if (resolvedRequest.missing.length > 0) {
        setBase64("");
        setError(`Missing required fields: ${resolvedRequest.missing.join(", ")}`);
        return;
      }

      if (!resolvedRequest.request) {
        setBase64("");
        setError("Unable to build document request.");
        return;
      }

      if (existingBase64 && existingRequestKey && existingRequestKey === requestKey) {
        setBase64(existingBase64);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await window.electron.service.getDocument(resolvedRequest.request);
        if (!active) return;

        const normalized = String(response || "").trim();
        if (!normalized) {
          setError("Document not found.");
          setBase64("");
          return;
        }

        setBase64(normalized);
        actions.onUpdateStepData({
          documentBase64: normalized,
          documentRequestKey: requestKey,
        });
      } catch (err) {
        if (!active) return;
        setBase64("");
        setError((err as Error)?.message || "Failed to load document.");
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
  }, [actions, documentConfig?.endpoint, existingBase64, existingRequestKey, requestKey, resolvedRequest]);

  const dataUri = useMemo(() => buildDataUriFromBase64(base64), [base64]);
  const previewKind = useMemo(() => detectBase64ContentKind(base64), [base64]);
  const previewSrc = useMemo(() => {
    if (previewKind === "pdf") {
      return `${dataUri}#toolbar=0&navpanes=0&scrollbar=0`;
    }
    return dataUri;
  }, [dataUri, previewKind]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", bounce: 0, stiffness: 320, damping: 34 }}
      className="service-modal document-preview-step"
    >
      <div className="service-modal-body document-preview-body">
        <div className="step-header">
          <h1>{config.title || ""}</h1>
          <p>Та бичиг баримтыг шалгана уу.</p>
        </div>

        {isLoading ? (
          <div className="loading-container document-preview-fill">
            <div className="processing-spinner" />
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="document-preview-fill">
            <StateCard
              title="Document unavailable"
              description="The document could not be loaded."
              detail={error}
              tone="warning"
            />
          </div>
        ) : !base64 ? (
          <div className="document-preview-fill">
            <StateCard
              title="No document found"
              description="No document data was returned."
              tone="warning"
            />
          </div>
        ) : (
          <div className="result-details document-preview-fill">
            {previewKind === "pdf" || previewKind === "html" ? (
              <iframe
                title="Document Preview"
                src={previewSrc}
                className="document-preview-frame"
              />
            ) : (
              <img
                src={previewSrc}
                alt="Document Preview"
                className="document-preview-image"
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
