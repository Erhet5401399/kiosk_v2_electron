interface SelectInputOption {
  id: string;
  label: string;
}

type SelectInputGroupedOptions = Record<string, SelectInputOption[]>;

interface SelectInputFieldProps {
  label: string;
  value: string;
  options: SelectInputOption[];
  groupedOptions?: SelectInputGroupedOptions | null;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function SelectInputField({
  label,
  value,
  options,
  groupedOptions,
  placeholder = "Сонгох...",
  onChange,
}: SelectInputFieldProps) {
  const groups = groupedOptions ? Object.entries(groupedOptions) : [];
  const hasGroups = groups.length > 0;

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
        {hasGroups
          ? groups.map(([groupLabel, groupOptions]) => (
              <optgroup key={groupLabel} label={groupLabel}>
                {groupOptions.map((option, optionIndex) => (
                  <option key={`${groupLabel}-${option.id}-${optionIndex}`} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))
          : options.map((option, optionIndex) => (
              <option key={`${option.id}-${optionIndex}`} value={option.id}>
                {option.label}
              </option>
            ))}
      </select>
    </div>
  );
}


