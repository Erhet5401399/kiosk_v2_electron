import { useEffect, useMemo, useRef, useState } from "react";
import type { StepComponentProps } from "../../../types/steps";
import { Button, useSnackbar } from "../../common";
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

export function LandParcelOnlineRequestStep({ context, actions, config }: StepComponentProps) {
  const { stepData } = context;
  const { showError } = useSnackbar();
  const isLegacyFormStep = config.id === "parcel-online-request-form";
  const combinedDone = stepData.online_request_combined_done === true;

  const registerNumber = String(stepData.register_number || "").trim();
  const parcelId = String(stepData.parcel_id || "").trim();
  const selectedOnlineRequestCode = Number(stepData.online_request_code || 0) || 0;

  const [onlineRequest, setOnlineRequest] = useState<ParcelOnlineRequest | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [requiredValue, setRequiredValue] = useState(String(stepData.online_request_form_value || ""));
  const [formFields, setFormFields] = useState<ParcelOnlineRequestFormField[]>([]);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [hasFetchedForm, setHasFetchedForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardTarget, setKeyboardTarget] = useState<string | null>(null);
  const [keyboardPosition, setKeyboardPosition] = useState<{ left: number; top: number; width: number } | null>(null);

  const fetchKeyRef = useRef("");
  const autoFetchAttemptedRef = useRef("");
  const inputRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const formPanelRef = useRef<HTMLDivElement | null>(null);

  const isReady = Boolean(registerNumber && parcelId);

  const selectedRequest = useMemo(
    () => onlineRequest?.appTypeList?.find((item) => item.code === selectedOnlineRequestCode) || null,
    [onlineRequest, selectedOnlineRequestCode],
  );

  const requiredInput = selectedRequest?.required_input as RequiredInput | undefined;
  const requiredFieldKey = normalizeFieldKey(requiredInput?.field);
  const requiredFieldTitle = String(requiredInput?.title || "").trim();
  const hasRequiredInput = Boolean(requiredFieldKey);

  const visibleFields = useMemo(
    () => formFields.filter((field) => !field.hide),
    [formFields],
  );

  const missingRequired = useMemo(
    () =>
      formFields
        .map((field) => normalizeFieldKey(field.field))
        .filter((key) => key.length > 0)
        .filter((key) => !String(formValues[key] || "").trim()),
    [formFields, formValues],
  );

  const canFetchForm =
    Boolean(selectedOnlineRequestCode) &&
    !isLoadingForm &&
    (!hasRequiredInput || requiredValue.trim().length > 0);

  const canContinue =
    Boolean(selectedOnlineRequestCode) &&
    hasFetchedForm &&
    !isLoadingForm &&
    missingRequired.length === 0;

  const raiseError = (message: string) => {
    setError(message);
    showError(message);
  };

  const fetchRequestList = async () => {
    if (!isReady) {
      setOnlineRequest(null);
      return;
    }

    setIsLoadingList(true);
    setError(null);

    try {
      if (!window.electron?.parcel?.onlineRequestList) {
        throw new Error("Electron IPC not available");
      }

      const response = await window.electron.parcel.onlineRequestList(registerNumber, parcelId);
      setOnlineRequest(response || null);
    } catch (err) {
      setOnlineRequest(null);
      raiseError((err as Error)?.message || "Failed to fetch requests");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    void fetchRequestList();
  }, [registerNumber, parcelId]);

  useEffect(() => {
    if (!isLegacyFormStep || !combinedDone) return;
    actions.onNext();
  }, [actions, combinedDone, isLegacyFormStep]);

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
    if (!selectedOnlineRequestCode) return;

    const normalizedRequiredValue = String(requestValue || "").trim();
    const requestCode = String(selectedOnlineRequestCode);
    const key = `${registerNumber}|${parcelId}|${requestCode}|${normalizedRequiredValue}`;
    if (fetchKeyRef.current === key && hasFetchedForm) return;

    setIsLoadingForm(true);
    setError(null);

    try {
      if (!window.electron?.parcel?.onlineRequestForm) {
        throw new Error("Electron IPC not available");
      }

      const response = await window.electron.parcel.onlineRequestForm(
        registerNumber,
        parcelId,
        requestCode,
        normalizedRequiredValue || undefined,
      );

      const fields = (Array.isArray(response) ? response : []).filter(
        (field) => normalizeFieldKey(field?.field).length > 0,
      );

      const values = buildInitialValues(fields, normalizedRequiredValue);

      setFormFields(fields);
      setFormValues(values);
      setHasFetchedForm(true);
      setKeyboardTarget(null);
      fetchKeyRef.current = key;

      const patch: Record<string, unknown> = {
        online_request_form_fields: fields,
      };

      if (requiredFieldKey && normalizedRequiredValue) {
        patch.online_request_form_value = normalizedRequiredValue;
        patch[requiredFieldKey] = normalizedRequiredValue;
      }

      actions.onUpdateStepData(patch);
    } catch (err) {
      setFormFields([]);
      setFormValues({});
      setHasFetchedForm(false);
      fetchKeyRef.current = "";
      raiseError((err as Error)?.message || "Failed to fetch form fields");
    } finally {
      setIsLoadingForm(false);
    }
  };

  useEffect(() => {
    if (!selectedOnlineRequestCode || hasRequiredInput || hasFetchedForm || isLoadingForm) return;
    const autoKey = `${registerNumber}|${parcelId}|${selectedOnlineRequestCode}`;
    if (autoFetchAttemptedRef.current === autoKey) return;
    autoFetchAttemptedRef.current = autoKey;
    void fetchForms();
  }, [hasFetchedForm, hasRequiredInput, isLoadingForm, parcelId, registerNumber, selectedOnlineRequestCode]);

  const handleSelect = (value: ParcelOnlineRequest["appTypeList"][0]) => {
    if (value.code === selectedOnlineRequestCode) return;

    setError(null);
    setRequiredValue("");
    setFormFields([]);
    setFormValues({});
    setHasFetchedForm(false);
    setKeyboardTarget(null);
    fetchKeyRef.current = "";
    autoFetchAttemptedRef.current = "";

    actions.onUpdateStepData({
      online_request_code: value.code,
      online_request_required_input: value.required_input,
      online_request_form_value: "",
      online_request_form_fields: [],
      online_request_form_values: {},
      online_request_combined_done: false,
    });
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleFetchForm = async () => {
    if (!selectedOnlineRequestCode) {
      raiseError("Цахим хүсэлт сонгоно уу.");
      return;
    }

    const normalizedRequiredValue = requiredValue.trim();
    if (hasRequiredInput && !normalizedRequiredValue) {
      raiseError("Талбарыг бөглөнө үү.");
      return;
    }

    await fetchForms(normalizedRequiredValue);
  };

  const handleContinue = () => {
    if (!selectedOnlineRequestCode) {
      raiseError("Цахим хүсэлт сонгоно уу.");
      return;
    }

    if (missingRequired.length > 0) {
      raiseError("Бүх шаардлагатай талбарыг бөглөнө үү.");
      return;
    }

    const patch: Record<string, unknown> = {
      online_request_form_values: formValues,
      online_request_form_fields: formFields,
      online_request_combined_done: true,
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

  const positionKeyboardFor = (target: string) => {
    const el = inputRefs.current[target];
    if (!el) {
      setKeyboardPosition(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const margin = 12;
    const maxWidth = Math.max(420, window.innerWidth - margin * 2);
    const preferredWidth = Math.max(rect.width, 620);
    let keyboardWidth = Math.min(maxWidth, preferredWidth);
    const keyboardHeight = 320;

    let left = Math.max(margin, rect.left);
    const rightLimit = window.innerWidth - margin;
    if (left + keyboardWidth > rightLimit) {
      keyboardWidth = Math.max(420, rightLimit - left);
    }

    let top = rect.bottom + 8;
    if (top + keyboardHeight > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - keyboardHeight - 8);
    }

    setKeyboardPosition({ left, top, width: keyboardWidth });
  };

  const focusKeyboardTarget = (target: string) => {
    setKeyboardPosition(null);
    setKeyboardTarget(target);
    requestAnimationFrame(() => positionKeyboardFor(target));
  };

  useEffect(() => {
    if (!keyboardTarget) return;

    const recalc = () => positionKeyboardFor(keyboardTarget);
    const panel = formPanelRef.current;
    recalc();

    window.addEventListener("resize", recalc);
    panel?.addEventListener("scroll", recalc);

    return () => {
      window.removeEventListener("resize", recalc);
      panel?.removeEventListener("scroll", recalc);
    };
  }, [keyboardTarget]);

  if (isLegacyFormStep && combinedDone) {
    return (
      <div className="service-modal">
        <div className="service-modal-body">
          <div className="loading-container">
            <div className="processing-spinner" />
            <p>Түр хүлээнэ үү...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="service-modal online-request-step">
      <div className="service-modal-body online-request-body">
        <div className="step-header online-request-header">
          <h1>Цахим хүсэлт илгээх</h1>
          <p>Та хүсэлтийн төрөлөө сонгон хүсэлтээ илгээнэ үү.</p>
        </div>

        <div className="online-request-layout">
          <div className="online-request-menu-panel">
            {isLoadingList ? (
              <div className="loading-container">
                <div className="processing-spinner" />
                <p>Түр хүлээнэ үү...</p>
              </div>
            ) : onlineRequest?.appTypeList?.length ? (
              <div className="online-request-menu-list">
                {onlineRequest.appTypeList.map((item) => (
                  <button
                    key={item.code}
                    className={`online-request-menu-item ${selectedOnlineRequestCode === item.code ? "selected" : ""}`}
                    onClick={() => handleSelect(item)}
                  >
                    <div className="online-request-menu-item-text">
                      <span>{item.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="step-no-data">
                <p>Цахим хүсэлтийн жагсаалт олдсонгүй.</p>
              </div>
            )}
          </div>

          <div className="online-request-form-panel" ref={formPanelRef}>
            {!selectedOnlineRequestCode ? (
              <div className="step-no-data">
                <p>Эхлээд хүсэлтээ сонгоно уу.</p>
              </div>
            ) : hasRequiredInput && !hasFetchedForm ? (
              <div className="auth-sms-layout">
                <div className="auth-sms-card">
                  <button
                    ref={(el) => {
                      inputRefs.current.__required__ = el;
                    }}
                    type="button"
                    className={`registration-input-field ${keyboardTarget === "__required__" ? "active" : ""}`}
                    style={{ width: "100%" }}
                    onClick={() => focusKeyboardTarget("__required__")}
                  >
                    <div className="input-label">{requiredFieldTitle || requiredFieldKey}</div>
                    <div className="input-value">
                      {requiredValue || <span className="placeholder"></span>}
                    </div>
                  </button>
                </div>
              </div>
            ) : isLoadingForm && !hasFetchedForm ? (
              <div className="loading-container">
                <div className="processing-spinner" />
                <p>Түр хүлээнэ үү...</p>
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
                          <div className="registration-input-field active" style={{ cursor: "default", width: "100%" }}>
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
                          <>
                            <button
                              ref={(el) => {
                                inputRefs.current[key] = el;
                              }}
                              type="button"
                              className={`registration-input-field ${keyboardTarget === key ? "active" : ""}`}
                              style={{ width: "100%" }}
                              onClick={() => focusKeyboardTarget(key)}
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
                                {value || <span className="placeholder"></span>}
                              </div>
                            </button>
                          </>
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

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack}>
            Буцах
          </Button>

          {!hasFetchedForm ? (
            <Button onClick={handleFetchForm} disabled={!canFetchForm}>
              {isLoadingForm ? "Түр хүлээнэ үү..." : "Үргэлжлүүлэх"}
            </Button>
          ) : (
            <Button onClick={handleContinue} disabled={!canContinue}>
              Хүсэлт илгээх
            </Button>
          )}
        </div>
      </div>

      {keyboardTarget && keyboardPosition ? (
        <div
          className="online-request-floating-keyboard"
          style={{
            left: keyboardPosition.left,
            top: keyboardPosition.top,
            width: keyboardPosition.width,
          }}
        >
          <VirtualKeyboard
            mode="alphanumeric"
            onKeyClick={appendKeyboard}
            onBackspace={backspaceKeyboard}
            onDone={() => {
              setKeyboardTarget(null);
              setKeyboardPosition(null);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
