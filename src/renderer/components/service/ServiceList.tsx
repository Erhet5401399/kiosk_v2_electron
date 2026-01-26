import type { Service } from '../../types';
import { ServiceCard } from './ServiceCard';

interface ServiceListProps {
  services: Service[];
  onSelectService: (service: Service) => void;
}

export function ServiceList({ services, onSelectService }: ServiceListProps) {
  return (
    <main className="service-list">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} onSelect={onSelectService} />
      ))}
    </main>
  );
}
