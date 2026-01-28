import type { Service } from "../../types";
import { ArrowIcon } from "../common";

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
}

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <div className="service-card" onClick={() => onSelect(service)}>
      <div className="card-header-flex">
        <div className="service-icon-box small">{service.icon}</div>
        <h3>{service.name}</h3>
      </div>
      <div className="card-content">
        <p>{service.desc}</p>
      </div>
      <div className="card-footer">
        <span className="price">{service.price}</span>
        <div className="select-btn">
          <span>Үйлчилгээ авах</span>
          <ArrowIcon />
        </div>
      </div>
    </div>
  );
}
