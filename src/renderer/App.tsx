import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Service } from './types';
import { CATEGORIES, SERVICES, STATE_LABELS } from './constants';
import { useElectron, useUpdater } from './hooks';
import { PromoSection, Sidebar, LoadingScreen, StatusBar } from './components/layout';
import { ServiceList } from './components/service';
import { ServiceModal } from './components/modal';
import './styles/index.css';

export default function App() {
  const { snapshot, handlePrint } = useElectron();
  const { updateStatus, checkForUpdates } = useUpdater();

  const [selectedCategory, setSelectedCategory] = useState('Бүгд');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'Бүгд') return SERVICES;
    return SERVICES.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
  };

  const handlePrintAndClose = async (registerNumber: string) => {
    if (selectedService) {
      await handlePrint(
        `Service: ${selectedService.name}\nRegister: ${registerNumber}\nPrice: ${selectedService.price}`
      );
      handleCloseModal();
    }
  };

  if (snapshot.state !== 'ready') {
    return <LoadingScreen state={snapshot.state} deviceId={snapshot.deviceId} />;
  }

  return (
    <div className="screen">
      <PromoSection />

      <div className="content sidebar-layout">
        <Sidebar
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <ServiceList services={filteredServices} onSelectService={handleServiceSelect} />
      </div>

      <AnimatePresence>
        {selectedService && (
          <ServiceModal
            service={selectedService}
            onPrint={handlePrintAndClose}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>

      <StatusBar
        deviceState={STATE_LABELS[snapshot.state]}
        deviceId={snapshot.deviceId}
        uptime={snapshot.uptime}
        updaterStatus={updateStatus}
        onUpdateCheck={checkForUpdates}
      />
    </div>
  );
}
