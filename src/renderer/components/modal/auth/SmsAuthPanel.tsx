type SmsField = "registerNumber" | "phoneNumber" | "smsCode";

interface SmsAuthPanelProps {
  registerNumber: string;
  phoneNumber: string;
  smsCode: string;
  keyboardTarget: SmsField | null;
  smsCodeSent: boolean;
  hintText: string;
  onFocusRegister: () => void;
  onFocusPhone: () => void;
  onFocusSmsCode: () => void;
}

function SmsDisplayField({
  label,
  value,
  active,
  secure,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  secure?: boolean;
  onClick: () => void;
}) {
  const displayValue = secure && value ? "•".repeat(value.length) : value;

  return (
    <div
      className={`registration-input-field ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <div className="input-label">{label}</div>
      <div className="input-value">
        {active && !displayValue && <div className="input-cursor" />}
        {displayValue || <span className="placeholder" />}
        {active && displayValue && <div className="input-cursor" />}
      </div>
    </div>
  );
}

export function SmsAuthPanel({
  registerNumber,
  phoneNumber,
  smsCode,
  keyboardTarget,
  smsCodeSent,
  hintText,
  onFocusRegister,
  onFocusPhone,
  onFocusSmsCode,
}: SmsAuthPanelProps) {
  return (
    <div className="auth-sms-card">
      <div className="auth-sms-head">
        <h3>Нэг удаагийн нэвтрэх код</h3>
        <p>Та регистрийн дугаар болон утасны дугаар оруулж, нэвтрэх кодыг хүлээн авна уу.</p>
      </div>

      <SmsDisplayField
        label="Регистрийн дугаар"
        value={registerNumber}
        active={keyboardTarget === "registerNumber"}
        onClick={onFocusRegister}
      />

      <SmsDisplayField
        label="Утасны дугаар"
        value={phoneNumber}
        active={keyboardTarget === "phoneNumber"}
        onClick={onFocusPhone}
      />

      {smsCodeSent && (
        <SmsDisplayField
          label="Нэг удаагийн код"
          value={smsCode}
          active={keyboardTarget === "smsCode"}
          secure
          onClick={onFocusSmsCode}
        />
      )}

      {!!hintText &&
        <p className="auth-hint">{hintText}</p>
      }
    </div>
  );
}
