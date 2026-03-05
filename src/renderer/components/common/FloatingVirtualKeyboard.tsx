import { VirtualKeyboard } from "../keyboard";

interface FloatingVirtualKeyboardProps {
  visible: boolean;
  position: { left: number; top: number; width: number } | null;
  mode?: "alphanumeric" | "numeric";
  onKeyClick: (key: string) => void;
  onBackspace: () => void;
  onDone: () => void;
}

export function FloatingVirtualKeyboard({
  visible,
  position,
  mode = "alphanumeric",
  onKeyClick,
  onBackspace,
  onDone,
}: FloatingVirtualKeyboardProps) {
  if (!visible || !position) return null;

  return (
    <div
      className="online-request-floating-keyboard"
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
      }}
    >
      <VirtualKeyboard mode={mode} onKeyClick={onKeyClick} onBackspace={onBackspace} onDone={onDone} />
    </div>
  );
}
