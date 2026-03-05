import { useEffect, useMemo, useRef, useState } from "react";
import type { StepComponentProps } from "../../../types/steps";
import { Button } from "../../common";
import { VirtualKeyboard } from "../../keyboard";
import type { ParcelOnlineRequest, ParcelOnlineRequestFormField } from "../../../../shared/types";

type FormValues = Record<string, string>;
type RequiredInput = ParcelOnlineRequest["appTypeList"][0]["required_input"];

function normalizeFieldKey(value: unknown): string {
  return String(value || "").trim();
}

function normalizeQrBase64(raw: unknown): string {
  let value = String(raw || "").trim();
  if (!value) return "";
  value = value.replace(/\\n/g, "").replace(/\\r/g, "");
  value = value.replace(/^["'`]+|["'`]+$/g, "");
  if (/^data:image\//i.test(value)) return value;
  const compact = value.replace(/\s+/g, "");
  return compact ? `data:image/png;base64,${compact}` : "";
}

function prettifyFieldName(field: string): string {
  return field
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function LandParcelOnlineRequestFormStep({ context, actions }: StepComponentProps) {
  const { stepData } = context;

  const registerNumber = String(stepData.register_number || "").trim();
  const parcelId = String(stepData.parcel_id || "").trim();
  const onlineRequestCode = String(stepData.online_request_code || "").trim();
  const requiredInput = stepData.online_request_required_input as RequiredInput | undefined;

  const requiredFieldKey = normalizeFieldKey(requiredInput?.field);
  const requiredFieldTitle = String(requiredInput?.title || "").trim();
  const hasRequiredInput = Boolean(requiredFieldKey);

  const [requiredValue, setRequiredValue] = useState("");
  const [formFields, setFormFields] = useState<ParcelOnlineRequestFormField[]>([]);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardTarget, setKeyboardTarget] = useState<string | null>(null);
  const fetchKeyRef = useRef("");

  const isReady = Boolean(registerNumber && parcelId && onlineRequestCode);

  const buildInitialValues = (
    fields: ParcelOnlineRequestFormField[],
    requestValue: string,
  ): FormValues => {
    const initialValues: FormValues = {};

    fields.forEach((field) => {
      const key = normalizeFieldKey(field.field);
      if (!key) return;

      const firstOption =
        Array.isArray(field.options) && field.options.length > 0
          ? String(field.options[0]?.id || "").trim()
          : "";

      const fromInitial = String(field.initialInputValue ?? "").trim();
      const fromStepData = String(stepData[key] ?? "").trim();

      if (field.hide) {
        if (requiredFieldKey && key === requiredFieldKey && requestValue) {
          initialValues[key] = requestValue;
          return;
        }
        initialValues[key] = fromStepData || fromInitial || firstOption;
        return;
      }

      initialValues[key] = fromInitial || fromStepData || firstOption;
    });

    return initialValues;
  };

  const fetchForms = async (requestValue?: string) => {
    if (!isReady) return;

    const normalizedRequestValue = String(requestValue || "").trim();
    const key = `${registerNumber}|${parcelId}|${onlineRequestCode}|${normalizedRequestValue}`;
    if (fetchKeyRef.current === key && hasFetched) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!window.electron?.parcel?.onlineRequestForm) {
        throw new Error("Electron IPC not available");
      }

      const response = await window.electron.parcel.onlineRequestForm(
        registerNumber,
        parcelId,
        onlineRequestCode,
        normalizedRequestValue || undefined,
      );

      const fields = (Array.isArray(response) ? response : []).filter(
        (field) => normalizeFieldKey(field?.field).length > 0,
      );

      setFormFields(fields);
      setFormValues(buildInitialValues(fields, normalizedRequestValue));
      setHasFetched(true);
      setKeyboardTarget(null);
      fetchKeyRef.current = key;

      if (requiredFieldKey && normalizedRequestValue) {
        actions.onUpdateStepData({
          online_request_form_value: normalizedRequestValue,
          [requiredFieldKey]: normalizedRequestValue,
        });
      }
    } catch (err) {
      setFormFields([]);
      setFormValues({});
      setHasFetched(false);
      fetchKeyRef.current = "";
      setError((err as Error)?.message || "Failed to fetch form fields");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isReady || hasRequiredInput || hasFetched || isLoading) return;
    void fetchForms();
  }, [hasFetched, hasRequiredInput, isLoading, isReady, onlineRequestCode, parcelId, registerNumber]);

  const visibleFields = useMemo(
    () => formFields.filter((field) => !field.hide),
    [formFields],
  );

  const inputFieldKeys = useMemo(
    () =>
      visibleFields
        .filter((field) => field.type !== "select")
        .map((field) => normalizeFieldKey(field.field))
        .filter(Boolean),
    [visibleFields],
  );

  const missingRequired = useMemo(
    () =>
      formFields
        .map((field) => normalizeFieldKey(field.field))
        .filter((key) => key.length > 0)
        .filter((key) => !String(formValues[key] || "").trim()),
    [formFields, formValues],
  );

  const canFetchWithRequiredInput =
    isReady && !isLoading && (!hasRequiredInput || requiredValue.trim().length > 0);

  const canContinue =
    isReady && !isLoading && hasFetched && missingRequired.length === 0;

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleFetch = async () => {
    if (!isReady) {
      setError("Хүсэлтийн мэдээлэл дутуу байна.");
      return;
    }

    const normalizedRequiredValue = requiredValue.trim();

    if (hasRequiredInput && !normalizedRequiredValue) {
      setError("Талбарыг бөглөнө үү.");
      return;
    }

    await fetchForms(normalizedRequiredValue);
  };

  const handleContinue = () => {
    if (missingRequired.length > 0) {
      setError("Бүх шаардлагатай талбарыг бөглөнө үү.");
      return;
    }

    const patch: Record<string, unknown> = {
      online_request_form_values: formValues,
      online_request_form_fields: formFields,
    };

    Object.entries(formValues).forEach(([key, value]) => {
      patch[key] = value;
    });

    actions.onUpdateStepData(patch);
    actions.onNext();
  };

  const appendKeyboard = (key: string) => {
    if (!keyboardTarget) return;

    if (keyboardTarget === "__required__") {
      setRequiredValue((prev) => `${prev}${key}`);
      return;
    }

    handleFieldChange(keyboardTarget, `${formValues[keyboardTarget] || ""}${key}`);
  };

  const backspaceKeyboard = () => {
    if (!keyboardTarget) return;

    if (keyboardTarget === "__required__") {
      setRequiredValue((prev) => prev.slice(0, -1));
      return;
    }

    const value = String(formValues[keyboardTarget] || "");
    handleFieldChange(keyboardTarget, value.slice(0, -1));
  };

  return (
    <div className="service-modal">
      <div className="service-modal-body-login">
        <div className="step-header">
          <h1>Хүсэлтийн форм бөглөх</h1>
          <p>Шаардлагатай мэдээллийг оруулна уу.</p>
        </div>

        {!isReady ? (
          <div className="step-no-data">
            <p>Хүсэлтийн төрөл болон нэгж талбараа эхлээд сонгоно уу.</p>
          </div>
        ) : hasRequiredInput && !hasFetched ? (
          <div className="auth-sms-layout">
            <div className="auth-sms-card">
              <button
                type="button"
                className={`registration-input-field ${keyboardTarget === "__required__" ? "active" : ""}`}
                style={{ width: "100%" }}
                onClick={() => setKeyboardTarget("__required__")}
              >
                <div className="input-label">{requiredFieldTitle || requiredFieldKey}</div>
                <div className="input-value">
                  {requiredValue || <span className="placeholder">...</span>}
                </div>
              </button>
            </div>
          </div>
        ) : isLoading && !hasFetched ? (
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Түр хүлээнэ үү...</p>
          </div>
        ) : error && !hasFetched ? (
          <div className="step-no-data">
            <p>{error}</p>
          </div>
        ) : (
          <div className="auth-sms-layout">
            <div className="auth-sms-card">
              {visibleFields.map((field) => {
                const key = normalizeFieldKey(field.field);
                const label = String(field.title || "").trim() || prettifyFieldName(key) || key;
                const options = Array.isArray(field.options) ? field.options : [];
                const isSelect = field.type === "select" && options.length > 0;
                const value = String(formValues[key] ?? "");
                const qrSrc = normalizeQrBase64(field.qr_code);

                return (
                  <div key={key} style={{ width: "100%" }}>
                    {isSelect ? (
                      <div
                        className="registration-input-field active"
                        style={{ cursor: "default", width: "100%" }}
                      >
                        <div className="input-label">{label}</div>
                        <select
                          value={value}
                          onChange={(event) => handleFieldChange(key, event.target.value)}
                          style={{
                            width: "100%",
                            minHeight: "46px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            padding: "10px 12px",
                            fontSize: "1rem",
                          }}
                        >
                          <option value="">Сонгох...</option>
                          {options.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`registration-input-field ${keyboardTarget === key ? "active" : ""}`}
                        style={{ width: "100%" }}
                        onClick={() => setKeyboardTarget(key)}
                      >
                        <div className="input-label">{label}</div>
                        <div
                          className="input-value"
                          style={
                            field.long
                              ? {
                                  display: "block",
                                  whiteSpace: "pre-wrap",
                                  lineHeight: 1.35,
                                  width: "100%",
                                  minHeight: "4.8rem",
                                  letterSpacing: "normal",
                                  overflowWrap: "anywhere",
                                  wordBreak: "break-word",
                                }
                              : {
                                  display: "block",
                                  width: "100%",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }
                          }
                        >
                          {value || <span className="placeholder">...</span>}
                        </div>
                      </button>
                    )}

                    {qrSrc ? (
                      <div style={{ marginTop: "10px", textAlign: "center" }}>
                        <img
                          src={qrSrc}
                          alt={`${label} qr`}
                          style={{ width: "160px", height: "160px", objectFit: "contain" }}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {error ? (
                <div className="step-no-data" style={{ width: "100%" }}>
                  <p>{error}</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack}>
            Буцах
          </Button>

          {!hasFetched ? (
            <Button onClick={handleFetch} disabled={!canFetchWithRequiredInput}>
              {isLoading ? "Түр хүлээнэ үү..." : "Форм авах"}
            </Button>
          ) : (
            <Button onClick={handleContinue} disabled={!canContinue}>
              Үргэлжлүүлэх
            </Button>
          )}
        </div>
      </div>

      {keyboardTarget && (keyboardTarget === "__required__" || inputFieldKeys.includes(keyboardTarget)) && (
        <div className="modal-keyboard-host">
          <VirtualKeyboard
            mode="alphanumeric"
            onKeyClick={appendKeyboard}
            onBackspace={backspaceKeyboard}
            onDone={() => setKeyboardTarget(null)}
          />
        </div>
      )}
    </div>
  );
}
