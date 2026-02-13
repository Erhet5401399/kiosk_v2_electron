import type { ReactNode } from 'react';

interface StateCardProps {
  title: string;
  description: string;
  detail?: string;
  tone?: 'neutral' | 'warning';
  actions?: ReactNode;
}

export function StateCard({
  title,
  description,
  detail,
  tone = 'neutral',
  actions,
}: StateCardProps) {
  return (
    <div className={`state-card state-card-${tone}`}>
      <h2 className="state-card-title">{title}</h2>
      <p className="state-card-description">{description}</p>
      {detail ? <p className="state-card-detail">{detail}</p> : null}
      {actions ? <div className="state-card-actions">{actions}</div> : null}
    </div>
  );
}
