import type { CSSProperties } from "react";
import type { Service } from "../../types";
import { formatServicePrice } from "../../utils";
import { ArrowIcon } from "../common";

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
}

const ICON_PALETTE = [
  { bgStart: "#E8F1FF", bgEnd: "#D8E9FF", fg: "#0B56B8" },
  { bgStart: "#EAFBF3", bgEnd: "#D8F4E6", fg: "#0F8A52" },
  { bgStart: "#FFF3E8", bgEnd: "#FFE3CC", fg: "#B45309" },
  { bgStart: "#F3EDFF", bgEnd: "#E7DCFF", fg: "#6D28D9" },
  { bgStart: "#E9FBFF", bgEnd: "#D6F4FB", fg: "#0E7490" },
  { bgStart: "#FFECEF", bgEnd: "#FFDDE3", fg: "#BE123C" },
];

function ServiceGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="service-glyph"
      aria-hidden="true"
    >
      <path
        d="M7 3.5H14.5L19 8V20.5H7V3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 3.5V8H19M9.4 11H16M9.4 14H16M9.4 17H13.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  const palette = ICON_PALETTE[Math.abs(Number(service.id || 0)) % ICON_PALETTE.length];

  return (
    <div className="service-card" onClick={() => onSelect(service)}>
      <div className="card-header-flex">
        <div
          className="service-icon-box small"
          style={{
            "--service-icon-bg-start": palette.bgStart,
            "--service-icon-bg-end": palette.bgEnd,
            "--service-icon-fg": palette.fg,
          } as CSSProperties}
        >
          <ServiceGlyph />
        </div>
        <h3>{service.name}</h3>
      </div>
      <div className="card-content">
        <p>{service.desc}</p>
      </div>
      <div className="card-footer">
        <span className="price">{formatServicePrice(service.price)}</span>
        <div className="select-btn">
          <span>Үйлчилгээ авах</span>
          <ArrowIcon />
        </div>
      </div>
    </div>
  );
}
