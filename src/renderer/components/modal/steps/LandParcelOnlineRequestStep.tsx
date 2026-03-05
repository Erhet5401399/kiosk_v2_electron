import { useEffect, useMemo, useRef, useState } from "react";
import type { StepComponentProps } from "../../../types/steps";
import { BottomVirtualKeyboard, Button, KeyboardInputField, SelectInputField, useSnackbar } from "../../common";
import type {
  ParcelOnlineRequest,
  ParcelOnlineRequestFormField,
  ParcelOnlineRequestFormRequest,
} from "../../../../shared/types";

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

export function LandParcelOnlineRequestStep({ context, actions }: StepComponentProps) {
  const { stepData } = context;
  const { showError, showSuccess } = useSnackbar();

  const registerNumber = String(stepData.register_number || "").trim();
  const parcelId = String(stepData.parcel_id || "").trim();

  const [selectedOnlineRequestCode, setSelectedOnlineRequestCode] = useState(0);
  const [onlineRequest, setOnlineRequest] = useState<ParcelOnlineRequest | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [requiredValue, setRequiredValue] = useState("");
  const [formFields, setFormFields] = useState<ParcelOnlineRequestFormField[]>([]);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [hasFetchedForm, setHasFetchedForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [keyboardTarget, setKeyboardTarget] = useState<string | null>(null);

  const fetchKeyRef = useRef("");
  const autoFetchAttemptedRef = useRef("");

  const isReady = Boolean(registerNumber && parcelId);

  const selectedRequest = useMemo(
    () => onlineRequest?.appTypeList?.find((item) => item.code === selectedOnlineRequestCode) || null,
    [onlineRequest, selectedOnlineRequestCode],
  );

  const requiredInput = selectedRequest?.required_input as RequiredInput | undefined;
  const requiredFieldKey = normalizeFieldKey(requiredInput?.field);
  const requiredFieldTitle = String(requiredInput?.title || "").trim();
  const hasRequiredInput = Boolean(requiredFieldKey);

  const visibleFields = useMemo(() => formFields.filter((field) => !field.hide), [formFields]);

  const resolveFieldValue = (field: ParcelOnlineRequestFormField): string => {
    const key = normalizeFieldKey(field.field);
    if (!key) return "";

    const fromForm = String(formValues[key] ?? "").trim();
    const fromStepData = String(stepData[key] ?? "").trim();
    const fromInitial = String(field.initialInputValue ?? "").trim();

    return fromForm || fromStepData || fromInitial;
  };

  const missingRequired = useMemo(
    () =>
      formFields
        .filter((field) => normalizeFieldKey(field.field).length > 0)
        .map((field) => ({
          key: normalizeFieldKey(field.field),
          value: resolveFieldValue(field),
        }))
        .filter(({ value }) => !value),
    [formFields, formValues, stepData],
  );

  const canFetchForm =
    Boolean(selectedOnlineRequestCode) && !isLoadingForm && (!hasRequiredInput || requiredValue.trim().length > 0);

  const canContinue =
    Boolean(selectedOnlineRequestCode) && hasFetchedForm && !isLoadingForm && !isSubmitting && missingRequired.length === 0;

  const raiseError = (message: string) => {
    showError(message);
  };

  const fetchRequestList = async () => {
    if (!isReady) {
      setOnlineRequest(null);
      return;
    }

    setIsLoadingList(true);

    try {
      if (!window.electron?.parcel?.onlineRequestList) {
        throw new Error("Electron IPC not available");
      }

      const response = await window.electron.parcel.onlineRequestList(registerNumber, parcelId);
      setOnlineRequest(response || null);
      actions.onUpdateStepData({
        right_type: response?.parcel?.right_type_code,
      });

    } catch (err) {
      setOnlineRequest(null);
      raiseError((err as Error)?.message || "Хүсэлтийн жагсаалт авахад алдаа гарлаа.");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    void fetchRequestList();
  }, [registerNumber, parcelId]);

  const buildInitialValues = (fields: ParcelOnlineRequestFormField[], requestValue: string): FormValues => {
    const initialValues: FormValues = {};

    fields.forEach((field) => {
      const key = normalizeFieldKey(field.field);
      if (!key) return;

      const firstOption =
        Array.isArray(field.options) && field.options.length > 0 ? String(field.options[0]?.id || "").trim() : "";

      const fromInitial = String(field.initialInputValue ?? "").trim();

      if (field.hide) {
        if (requiredFieldKey && key === requiredFieldKey && requestValue) {
          initialValues[key] = requestValue;
          return;
        }
        initialValues[key] = fromInitial || firstOption;
        return;
      }

      initialValues[key] = fromInitial || firstOption;
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

    try {
      if (!window.electron?.parcel?.onlineRequestForm) {
        throw new Error("Electron IPC not available");
      }

      const request: ParcelOnlineRequestFormRequest = {
        registerNumber,
        parcelId,
        appType: requestCode,
        value: normalizedRequiredValue || undefined,
        needed: onlineRequest?.needed,
      };

      const response = await window.electron.parcel.onlineRequestForm(request);

      const fields = (Array.isArray(response) ? response : []).filter(
        (field) => normalizeFieldKey(field?.field).length > 0,
      );

      const values = buildInitialValues(fields, normalizedRequiredValue);

      setFormFields(fields);
      setFormValues(values);
      setHasFetchedForm(true);
      setKeyboardTarget(null);
      fetchKeyRef.current = key;

    } catch (err) {
      setFormFields([]);
      setFormValues({});
      setHasFetchedForm(false);
      fetchKeyRef.current = "";
      raiseError((err as Error)?.message || "Форм авахад алдаа гарлаа.");
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

    setSelectedOnlineRequestCode(value.code);
    setRequiredValue("");
    setFormFields([]);
    setFormValues({});
    setHasFetchedForm(false);
    setKeyboardTarget(null);
    fetchKeyRef.current = "";
    autoFetchAttemptedRef.current = "";

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

  const handleContinue = async () => {
    if (isSubmitting) return;

    if (!selectedOnlineRequestCode) {
      raiseError("Цахим хүсэлт сонгоно уу.");
      return;
    }

    if (missingRequired.length > 0) {
      raiseError("Бүх шаардлагатай талбарыг бөглөнө үү.");
      return;
    }

    const requestPayload: Record<string, unknown> = {};

    formFields.forEach((field) => {
      const key = normalizeFieldKey(field.field);
      if (!key) return;

      const resolved = resolveFieldValue(field);
      if (!resolved) return;
      requestPayload[key] = resolved;
    });

    if (!window.electron?.parcel?.onlineRequestSend) {
      raiseError("Хүсэлт илгээх боломжгүй байна.");
      return;
    }

    try {
      setIsSubmitting(true);
      await window.electron.parcel.onlineRequestSend(requestPayload);
      showSuccess("Хүсэлт амжилттай илгээгдлээ.");
    } catch (err) {
      raiseError((err as Error)?.message || "Хүсэлт илгээхэд алдаа гарлаа.");
    } finally {
      setIsSubmitting(false);
    }
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

  const focusKeyboardTarget = (target: string) => {
    setKeyboardTarget(target);
  };

  return (
    <div className="service-modal online-request-step">
      <div className="service-modal-body online-request-body">
        <div className="step-header online-request-header">
          <h1>Цахим хүсэлт илгээх</h1>
          <p>Та хүсэлтийн төрлөө сонгон хүсэлтээ илгээнэ үү.</p>
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

          <div className="online-request-form-panel">
            {!selectedOnlineRequestCode ? (
              <div className="step-no-data">
                <p>Эхлээд хүсэлтээ сонгоно уу.</p>
              </div>
            ) : hasRequiredInput && !hasFetchedForm ? (
              <div className="auth-sms-layout">
                <div className="auth-sms-card">
                  <KeyboardInputField
                    label={requiredFieldTitle || requiredFieldKey}
                    value={requiredValue}
                    active={keyboardTarget === "__required__"}
                    onClick={() => focusKeyboardTarget("__required__")}
                  />
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
                          <SelectInputField
                            label={label}
                            value={value}
                            options={options}
                            onChange={(nextValue) => handleFieldChange(key, nextValue)}
                          />
                        ) : (
                          <KeyboardInputField
                            label={label}
                            value={value}
                            active={keyboardTarget === key}
                            multiline={Boolean(field.long)}
                            onClick={() => focusKeyboardTarget(key)}
                          />
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
              {isSubmitting ? "Түр хүлээнэ үү..." : "Хүсэлт илгээх"}
            </Button>
          )}
        </div>
      </div>

      <BottomVirtualKeyboard
        visible={Boolean(keyboardTarget)}
        mode="alphanumeric"
        onKeyClick={appendKeyboard}
        onBackspace={backspaceKeyboard}
        onDone={() => setKeyboardTarget(null)}
      />
    </div>
  );
}
