import { motion } from 'framer-motion';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';

interface SuccessStepExtraProps {
  onPrint?: () => void;
}

export function SuccessStep({ 
  context, 
  actions,
  onPrint,
}: StepComponentProps & SuccessStepExtraProps) {
  const { service, stepData } = context;

  const handlePrint = () => {
    onPrint?.();
    actions.onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <div className="success-icon">✅</div>
          <h1>Төлбөр амжилттай</h1>
          <p>Таны баримт бэлэн боллоо</p>
        </div>

        <div className="pdf-preview-container">
          <div className="pdf-mock-page">
            <div className="pdf-header">
              <img
                src="https://burtgel.gov.mn/uploads/site/995/post/new_602f1c5d8d5b9a6a1c5c8f5e64d79787575c4ee8.png"
                alt="Soyombo"
                className="pdf-logo"
              />
              <div>
                <h4>ГАЗРЫН ХАРИЛЦАА, ГЕОДЕЗИ, ЗУРАГ ЗҮЙН ГАЗАР</h4>
                <p>Албан ёсны баримт бичиг</p>
              </div>
            </div>
            <hr />
            <div className="pdf-content">
              <div className="pdf-row">
                <span>Үйлчилгээ:</span>
                <strong>{service.name}</strong>
              </div>
              <div className="pdf-row">
                <span>Регистрийн дугаар:</span>
                <strong>{String(stepData.registerNumber || "")}</strong>
              </div>
              <div className="pdf-row">
                <span>Огноо:</span>
                <strong>{new Date().toLocaleDateString()}</strong>
              </div>
              <div className="pdf-row">
                <span>Төлөв:</span>
                <strong style={{ color: 'green' }}>Баталгаажсан</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onComplete}>
            Дуусгах
          </Button>
          <Button onClick={handlePrint}>Хэвлэх</Button>
        </div>
      </div>
    </motion.div>
  );
}
