import { motion } from 'framer-motion';
import { useEffect } from 'react';
import type { StepComponentProps } from '../../../types/steps';
import { Button } from '../../common';

type CitizenInfo = {
  regnum?: string;
  reghash?: string;
  image?: string;
  firstname?: string;
  lastname?: string;
  address?: string;
  personId?: string;
  phone?: string;
};

function resolveCitizenImage(value: string): string {
  const image = String(value || '').trim();
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:image/')) {
    return image;
  }
  return `data:image/jpeg;base64,${image}`;
}

export function RegistrationInputStep({ context, actions }: StepComponentProps) {
  const { service, stepData, keyboard } = context;
  const registerNumber = (stepData.registerNumber as string) || '';
  const citizen = (stepData.citizen as CitizenInfo | undefined) || undefined;
  const citizenImage = resolveCitizenImage(String(citizen?.image || ''));
  const citizenName = [citizen?.lastname, citizen?.firstname].filter(Boolean).join(' ');
  const displayRegnum = citizen?.regnum || registerNumber;
  const isActive = keyboard.activeTarget === 'registerNumber';

  useEffect(() => {
    actions.onKeyboardOpen('registerNumber', { mode: 'alphanumeric', maxLength: 10 });
    return () => actions.onKeyboardClose();
    // Keep this mount-scoped so step transition controls keyboard ownership.
  }, []);

  return (
    <motion.div
      className="service-modal"
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, stiffness: 320, damping: 34 }}
    >
      <div className="service-modal-body">
        <div className="service-header-modal">
          <div className="service-icon-box large">{service.icon}</div>
          <div>
            <h1>{service.name}</h1>
          </div>
        </div>

        <div>
          <p>{service.desc}</p>
        </div>

        {citizen && (
          <div className="citizen-panel">
            <div className="citizen-panel-head">
              {citizenImage ? (
                <img src={citizenImage} alt={citizenName || 'Citizen'} className="citizen-avatar" />
              ) : (
                <div className="citizen-avatar citizen-avatar-placeholder">
                  {(citizen?.firstname || citizen?.lastname || 'U').slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="citizen-main">
                <div className="citizen-main-name">{citizenName || 'Logged user'}</div>
                <div className="citizen-main-reg">{displayRegnum || '-'}</div>
              </div>
            </div>

            <div className="citizen-meta">
              <div className="citizen-meta-row">
                <span>Address</span>
                <strong>{citizen?.address || '-'}</strong>
              </div>
              <div className="citizen-meta-row">
                <span>Phone</span>
                <strong>{citizen?.phone || '-'}</strong>
              </div>
            </div>
          </div>
        )}

        <div
          className={`registration-input-field ${isActive ? 'active' : ''}`}
          onClick={() => actions.onKeyboardOpen('registerNumber', { mode: 'alphanumeric', maxLength: 10 })}
        >
          <div className="input-label">Регистрийн дугаар</div>
          <div className="input-value">
            {isActive && !registerNumber && <div className="input-cursor" />}
            {registerNumber || <span className="placeholder" />}
            {isActive && registerNumber && <div className="input-cursor" />}
          </div>
        </div>

        <div className="price-summary-box">
          <span className="label">Нийт төлбөр:</span>
          <span className="value">{service.price}</span>
        </div>
      </div>

      <div className="service-modal-footer">
        <div className="modal-footer">
          <Button variant="secondary" onClick={actions.onCancel}>
            Цуцлах
          </Button>
          <Button onClick={actions.onNext}>Үргэлжлүүлэх</Button>
        </div>
      </div>
    </motion.div>
  );
}
