import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Service } from './types';
import { CATEGORIES, SERVICES } from './constants';
import { useElectron, useRegistration } from './hooks';
import { PromoSection, Sidebar, LoadingScreen } from './components/layout';
import { ServiceList } from './components/service';
import { ServiceModal } from './components/modal';
import './styles/index.css';

export default function App() {
  const { snapshot, handlePrint } = useElectron();
  const registration = useRegistration();

  const [selectedCategory, setSelectedCategory] = useState('Бүгд');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'Бүгд') return SERVICES;
    return SERVICES.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    registration.reset();
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    registration.reset();
  };

  const handlePrintAndClose = async () => {
    if (selectedService) {
      await handlePrint(
        `Service: ${selectedService.name}\nRegister: ${registration.registerNumber}\nPrice: ${selectedService.price}`
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
            registerPrefix={registration.registerPrefix}
            registerSuffix={registration.registerSuffix}
            registerNumber={registration.registerNumber}
            showKeyboard={registration.showKeyboard}
            keyboardTarget={registration.keyboardTarget}
            onSetShowKeyboard={registration.setShowKeyboard}
            onSetKeyboardTarget={registration.setKeyboardTarget}
            onKeyClick={registration.handleKeyClick}
            onBackspace={registration.handleBackspace}
            onPrint={handlePrintAndClose}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
