import { useState, useMemo, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import type { UserAuthStatus } from "../shared/types";
import type { Service } from "./types";
import { CATEGORIES, SERVICES, STATE_LABELS } from "./constants";
import { useElectron, useUpdater } from "./hooks";
import {
  PromoSection,
  Sidebar,
  LoadingScreen,
  StatusBar,
} from "./components/layout";
import { ServiceList } from "./components/service";
import { ServiceModal, UserAuthModal } from "./components/modal";
import "./styles/index.css";

export default function App() {
  const { snapshot, handlePrint } = useElectron();
  const { updateStatus, checkForUpdates } = useUpdater();

  const [selectedCategory, setSelectedCategory] = useState("Бүгд");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [pendingService, setPendingService] = useState<Service | null>(null);
  const [authStatus, setAuthStatus] = useState<UserAuthStatus>({
    authenticated: false,
    session: null,
    reason: "not_authenticated",
  });

  const filteredServices = useMemo(() => {
    if (selectedCategory === "Бүгд") return SERVICES;
    return SERVICES.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  const loadAuthStatus = useCallback(async () => {
    if (!window.electron?.auth) return;
    const status = await window.electron.auth.status();
    setAuthStatus(status);
  }, []);

  useEffect(() => {
    void loadAuthStatus();
  }, [loadAuthStatus]);

  useEffect(() => {
    if (!window.electron?.auth) return;

    const onActivity = () => {
      void window.electron.auth.touch().then(setAuthStatus).catch(() => {});
    };

    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);

    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, []);

  const handleServiceSelect = async (service: Service) => {
    if (!window.electron?.auth) {
      setSelectedService(service);
      return;
    }

    const status = await window.electron.auth.status();
    setAuthStatus(status);

    if (status.authenticated) {
      void window.electron.auth.touch().then(setAuthStatus).catch(() => {});
      setSelectedService(service);
      return;
    }

    setPendingService(service);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
  };

  const handleAuthCancel = () => {
    setPendingService(null);
  };

  const handleAuthSuccess = () => {
    if (!pendingService) return;
    setSelectedService(pendingService);
    setPendingService(null);
    void loadAuthStatus();
  };

  const handlePrintAndClose = async (registerNumber: string) => {
    if (selectedService) {
      await handlePrint(
        `Service: ${selectedService.name}\nRegister: ${registerNumber}\nPrice: ${selectedService.price}`,
      );
      handleCloseModal();
    }
  };

  if (snapshot.state !== "ready") {
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
        <ServiceList
          services={filteredServices}
          onSelectService={handleServiceSelect}
        />
      </div>

      <AnimatePresence>
        {pendingService && (
          <UserAuthModal
            serviceName={pendingService.name}
            onCancel={handleAuthCancel}
            onSuccess={handleAuthSuccess}
          />
        )}

        {selectedService && (
          <ServiceModal
            service={selectedService}
            registerNumber={authStatus.session?.registerNumber || ""}
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
