import type { StepComponentProps } from "../../../types/steps";
import { Button } from "../../common";

export function PaymentMethodStep({ actions }: StepComponentProps) {
  const handleSelectPayment = (method: "qrcode" | "pos") => {
    actions.onUpdateStepData({ paymentMethod: method });
    actions.onNext();
  };

  return (
    <div
      className="service-modal"
    >
      <div className="service-modal-body">
        <div className="step-header">
          <h1>Төлбөрийн хэлбэр сонгох</h1>
          <p>Та төлбөрөө дараах аргуудаас сонгон төлнө үү</p>
        </div>

        <div className="payment-grid">
          <button className="payment-option" onClick={() => handleSelectPayment("qrcode")}>
            <div className="payment-icon">📱</div>
            <div className="payment-info">
              <h3>QPAY</h3>
              <span>SocialPay, QPay, Банкны апп</span>
            </div>
          </button>

          <button className="payment-option" onClick={() => handleSelectPayment("pos")}>
            <div className="payment-icon">💳</div>
            <div className="payment-info">
              <h3>КАРТ УНШУУЛАХ</h3>
              <span>Бүх төрлийн банкны карт</span>
            </div>
          </button>
        </div>
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="ghost" />
          <Button variant="secondary" onClick={actions.onBack}>
            Буцах
          </Button>
        </div>
      </div>
    </div>
  );
}




