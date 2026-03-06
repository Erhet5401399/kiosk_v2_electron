import type { CSSProperties } from "react";

interface KeyboardInputFieldProps {
  label: string;
  value: string;
  active?: boolean;
  multiline?: boolean;
  width?: CSSProperties["width"];
  onClick: () => void;
  inputRef?: (el: HTMLButtonElement | null) => void;
}

export function KeyboardInputField({
  label,
  value,
  active = false,
  multiline = false,
  width = "100%",
  onClick,
  inputRef,
}: KeyboardInputFieldProps) {
  const hasValue = String(value || "").length > 0;

  return (
    <button
      ref={inputRef}
      type="button"
      className={`registration-input-field ${active ? "active" : ""}`}
      style={{ width }}
      onClick={onClick}
    >
      <div className="input-label">{label}</div>
      <div
        className={`input-value ${multiline ? "is-multiline" : ""}`}
        style={
          multiline
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
        {active && !hasValue ? <span className="input-cursor input-cursor-inline" /> : null}
        {value || <span className="placeholder"></span>}
        {active && hasValue ? <span className="input-cursor input-cursor-inline" /> : null}
      </div>
    </button>
  );
}
