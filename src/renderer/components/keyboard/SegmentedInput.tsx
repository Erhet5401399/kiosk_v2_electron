import type { KeyboardTarget } from '../../types';

interface SegmentedInputProps {
  prefix: string;
  suffix: string;
  showKeyboard: boolean;
  keyboardTarget: KeyboardTarget;
  onPrefixClick: () => void;
  onSuffixClick: () => void;
}

export function SegmentedInput({
  prefix,
  suffix,
  showKeyboard,
  keyboardTarget,
  onPrefixClick,
  onSuffixClick,
}: SegmentedInputProps) {
  return (
    <div className="input-section">
      <label>Иргэний регистрийн дугаар</label>
      <div className="segmented-input-container">
        <div
          className={`segment-box prefix ${keyboardTarget === 'prefix' && showKeyboard ? 'active' : ''}`}
          onClick={onPrefixClick}
        >
          <span className="segment-label">Үсэг</span>
          <div className="segment-value">
            {prefix || <span className="placeholder">АА</span>}
            {keyboardTarget === 'prefix' && showKeyboard && <div className="cursor" />}
          </div>
        </div>
        <div className="segment-dash">-</div>
        <div
          className={`segment-box suffix ${keyboardTarget === 'suffix' && showKeyboard ? 'active' : ''}`}
          onClick={onSuffixClick}
        >
          <span className="segment-label">Тоо</span>
          <div className="segment-value">
            {suffix || <span className="placeholder">12345678</span>}
            {keyboardTarget === 'suffix' && showKeyboard && <div className="cursor" />}
          </div>
        </div>
      </div>
    </div>
  );
}
