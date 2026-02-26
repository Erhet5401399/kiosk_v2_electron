import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';

const PRINT_OPTIONS = [
  { id: 'a4', name: 'A4 хэмжээ', icon: '📄' },
  { id: 'a3', name: 'A3 хэмжээ', icon: '📃' },
  { id: 'color', name: 'Өнгөт хэвлэх', icon: '🎨' },
  { id: 'bw', name: 'Хар цагаан', icon: '⬛' },
];

export function PrintOptionsStep({ context, actions }: StepComponentProps) {
  const { stepData } = context;
  const selectedOptions = (stepData.printOptions as string[]) || [];

  const handleToggleOption = (optionId: string) => {
    const newOptions = selectedOptions.includes(optionId)
      ? selectedOptions.filter((id) => id !== optionId)
      : [...selectedOptions, optionId];
    actions.onUpdateStepData({ printOptions: newOptions });
  };

  return (
    <div
      className="service-modal"
    >
      <div className='service-modal-body'>
        <div className="step-header">
          <h1>Хэвлэх сонголт</h1>
          <p>Хэвлэхдээ ашиглах сонголтуудаа хийнэ үү</p>
        </div>

        <div className="print-options-list">
          {PRINT_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={`print-option ${selectedOptions.includes(option.id) ? 'selected' : ''}`}
              onClick={() => handleToggleOption(option.id)}
            >
              <div className="option-icon">{option.icon}</div>
              <div className="option-info">
                <h3>{option.name}</h3>
              </div>
              {selectedOptions.includes(option.id) && <div className="check-icon">✓</div>}
            </button>
          ))}
        </div>
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack}>
            Буцах
          </Button>
          <Button onClick={actions.onNext}>Үргэлжлүүлэх</Button>
        </div>
      </div>
    </div>
  );
}




