import { useEffect, useMemo, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { StepComponentProps } from "../../../types/steps";
import { Button, StateCard } from "../../common";
import { buildDataUriFromBase64, detectBase64ContentKind, normalizeBase64Payload } from "../../../utils";

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export function DocumentPreviewStep({ context, actions, config }: StepComponentProps) {
  const existingBase64 = normalizeBase64Payload(String(context.stepData.documentBase64 || ""));
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
  const [hasResolvedDocument, setHasResolvedDocument] = useState(Boolean(existingBase64));
  const [error, setError] = useState<string | null>(null);
  const [pdfPageImages, setPdfPageImages] = useState<string[]>([]);
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [pdfRenderError, setPdfRenderError] = useState<string | null>(null);
  const pdfListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setHasResolvedDocument(false);

      if (!documentConfig?.endpoint) {
        setBase64("");
        setError("Document endpoint is not configured.");
        setHasResolvedDocument(true);
        return;
      }

      if (resolvedRequest.missing.length > 0) {
        setBase64("");
        setError(`Missing required fields: ${resolvedRequest.missing.join(", ")}`);
        setHasResolvedDocument(true);
        return;
      }

      if (!resolvedRequest.request) {
        setBase64("");
        setError("Unable to build document request.");
        setHasResolvedDocument(true);
        return;
      }

      if (existingBase64 && existingRequestKey && existingRequestKey === requestKey) {
        setBase64(existingBase64);
        setError(null);
        setHasResolvedDocument(true);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await window.electron.service.getDocument(resolvedRequest.request);
        if (!active) return;

        const normalized = normalizeBase64Payload(String(response || ""));
        if (!normalized) {
          setError("Document not found.");
          setBase64("");
          setHasResolvedDocument(true);
          return;
        }

        setBase64(normalized);
        actions.onUpdateStepData({
          documentBase64: normalized,
          documentRequestKey: requestKey,
        });
        setHasResolvedDocument(true);
      } catch (err) {
        if (!active) return;
        setBase64("");
        setError((err as Error)?.message || "Failed to load document.");
        setHasResolvedDocument(true);
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
  const previewSrc = useMemo(() => dataUri, [dataUri]);

  useEffect(() => {
    setPdfPageImages([]);
    setPdfRenderError(null);
  }, [base64]);

  useEffect(() => {
    if (previewKind !== "pdf" || !base64) {
      setIsRenderingPdf(false);
      return;
    }

    let active = true;
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));

    const render = async () => {
      setIsRenderingPdf(true);
      setPdfRenderError(null);

      try {
        const loadingTask = getDocument({ data: bytes });
        const pdf = await loadingTask.promise;
        if (!active) {
          await loadingTask.destroy();
          return;
        }

        const renderedPages: string[] = [];
        const listWidth = pdfListRef.current?.clientWidth || 1000;
        const targetWidth = Math.max(640, Math.min(1400, listWidth * window.devicePixelRatio));

        for (let index = 1; index <= pdf.numPages; index += 1) {
          if (!active) break;
          const page = await pdf.getPage(index);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const scale = targetWidth / unscaledViewport.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const context2d = canvas.getContext("2d");
          if (!context2d) {
            throw new Error("PDF canvas context is unavailable.");
          }

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          await page.render({ canvasContext: context2d, viewport }).promise;
          renderedPages.push(canvas.toDataURL("image/png"));
        }

        if (!active) {
          await pdf.destroy();
          return;
        }
        setPdfPageImages(renderedPages);
        await pdf.destroy();
      } catch (err) {
        if (!active) return;
        setPdfRenderError((err as Error)?.message || "Failed to render PDF preview.");
      } finally {
        if (active) {
          setIsRenderingPdf(false);
        }
      }
    };

    void render();
    return () => {
      active = false;
    };
  }, [base64, previewKind]);

  return (
    <div
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
          hasResolvedDocument ? (
          <div className="document-preview-fill">
            <StateCard
              title="No document found"
              description="No document data was returned."
              tone="warning"
            />
          </div>
          ) : (
            <div className="loading-container document-preview-fill">
              <div className="processing-spinner" />
              <p>Loading...</p>
            </div>
          )
        ) : (
          <div className="document-preview-fill">
            {previewKind === "pdf" ? (
              <div className="document-preview-pdf">
                <div ref={pdfListRef} className="document-preview-canvas-wrap">
                  {isRenderingPdf && (
                    <div className="document-preview-rendering">Түр хүлээнэ үү...</div>
                  )}
                  {pdfRenderError ? (
                    <StateCard
                      title="PDF preview failed"
                      description="The PDF could not be rendered."
                      detail={pdfRenderError}
                      tone="warning"
                    />
                  ) : !isRenderingPdf && pdfPageImages.length === 0 ? (
                    <StateCard
                      title="PDF preview unavailable"
                      description="No pages could be rendered from this PDF."
                      tone="warning"
                    />
                  ) : (
                    <div className="document-preview-pages">
                      {pdfPageImages.map((imageSrc, index) => (
                        <img
                          key={`pdf-page-${index + 1}`}
                          src={imageSrc}
                          alt={`PDF page ${index + 1}`}
                          className="document-preview-page-image"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : previewKind === "html" ? (
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
    </div>
  );
}


