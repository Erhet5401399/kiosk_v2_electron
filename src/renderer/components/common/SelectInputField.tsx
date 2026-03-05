interface SelectInputOption {
  id: string;
  label: string;
}

interface SelectInputFieldProps {
  label: string;
  value: string;
  options: SelectInputOption[];
  placeholder?: string;
  onChange: (value: string) => void;
}

export function SelectInputField({
  label,
  value,
  options,
  placeholder = "Сонгох...",
  onChange,
}: SelectInputFieldProps) {
  return (
    <div className="registration-input-field active" style={{ cursor: "default", width: "100%" }}>
      <div className="input-label">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: "100%",
          minHeight: "46px",
          borderRadius: "10px",
          border: "1px solid #cbd5e1",
          padding: "10px 12px",
          fontSize: "1rem",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
