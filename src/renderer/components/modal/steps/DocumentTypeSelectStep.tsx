import { motion } from 'framer-motion';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';

const DOCUMENT_TYPES = [
  { id: 'cadastral-map', name: 'Кадастрын зураг', icon: '🗺️' },
  { id: 'cadastral-reference', name: 'Кадастрын лавлагаа', icon: '📑' },
  { id: 'ownership-certificate', name: 'Эзэмших эрхийн гэрчилгээ', icon: '📄' },
  { id: 'boundary-document', name: 'Хил хязгаарын баримт', icon: '📏' },
];

export function DocumentTypeSelectStep({ context, actions }: StepComponentProps) {
  const { stepData } = context;
  const selectedType = stepData.documentType as string | undefined;

  const handleSelectType = (typeId: string) => {
    actions.onUpdateStepData({ documentType: typeId });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Бичиг баримтын төрөл сонгох</h1>
          <p>Хэвлэх бичиг баримтын төрлийг сонгоно уу</p>
        </div>

        <div className="document-type-list">
          {DOCUMENT_TYPES.map((docType) => (
            <button
              key={docType.id}
              className={`document-option ${selectedType === docType.id ? 'selected' : ''}`}
              onClick={() => handleSelectType(docType.id)}
            >
              <div className="document-icon">{docType.icon}</div>
              <div className="document-info">
                <h3>{docType.name}</h3>
              </div>
              {selectedType === docType.id && <div className="check-icon">✓</div>}
            </button>
          ))}
        </div>
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onBack}>
            Буцах
          </Button>
          <Button onClick={actions.onNext} disabled={!selectedType}>
            Үргэлжлүүлэх
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
