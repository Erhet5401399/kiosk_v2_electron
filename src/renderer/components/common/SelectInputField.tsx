import { useEffect, useMemo, useRef, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(
    () => (groupedOptions ? Object.entries(groupedOptions) : []),
    [groupedOptions],
  );
  const hasGroups = groups.length > 0;

  const flattenedOptions = useMemo(
    () => (hasGroups ? groups.flatMap(([, list]) => list) : options),
    [groups, hasGroups, options],
  );

  const selectedLabel = useMemo(() => {
    const selected = flattenedOptions.find((opt) => String(opt.id) === String(value));
    return selected?.label || "";
  }, [flattenedOptions, value]);

  useEffect(() => {
    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!rootRef.current || !target) return;
      if (!rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`registration-input-field select-input-field ${open ? "active" : ""}`.trim()} style={{ width: "100%" }}>
      <div className="input-label">{label}</div>

      <button
        type="button"
        className={`select-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={`select-trigger-value ${selectedLabel ? "" : "is-placeholder"}`}>
          {selectedLabel || placeholder}
        </span>
        <span className="select-input-caret" aria-hidden="true">
          <svg className="select-input-caret-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="select-menu" role="listbox">
          {hasGroups
            ? groups.map(([groupLabel, groupOptions], groupIndex) => (
                <div key={`${groupLabel}-${groupIndex}`} className="select-group">
                  <div className="select-group-label">{groupLabel}</div>
                  {groupOptions.map((option, optionIndex) => {
                    const active = String(option.id) === String(value);
                    return (
                      <button
                        key={`${groupLabel}-${option.id}-${optionIndex}`}
                        type="button"
                        className={`select-menu-item ${active ? "active" : ""}`}
                        onClick={() => handleSelect(option.id)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              ))
            : options.map((option, optionIndex) => {
                const active = String(option.id) === String(value);
                return (
                  <button
                    key={`${option.id}-${optionIndex}`}
                    type="button"
                    className={`select-menu-item ${active ? "active" : ""}`}
                    onClick={() => handleSelect(option.id)}
                  >
                    {option.label}
                  </button>
                );
              })}
        </div>
      )}
    </div>
  );
}


