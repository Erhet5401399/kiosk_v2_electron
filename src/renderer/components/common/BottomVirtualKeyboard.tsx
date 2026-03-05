import { VirtualKeyboard } from "../keyboard";

interface BottomVirtualKeyboardProps {
  visible: boolean;
  mode?: "alphanumeric" | "numeric";
  onKeyClick: (key: string) => void;
  onBackspace: () => void;
  onDone: () => void;
}

export function BottomVirtualKeyboard({
  visible,
  mode = "alphanumeric",
  onKeyClick,
  onBackspace,
  onDone,
}: BottomVirtualKeyboardProps) {
  if (!visible) return null;

  return (
    <div className="modal-keyboard-host">
      <VirtualKeyboard mode={mode} onKeyClick={onKeyClick} onBackspace={onBackspace} onDone={onDone} />
    </div>
  );
}
