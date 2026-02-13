import { useState, useMemo, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import type {
  CategoryService,
  ServiceCategory,
  UserAuthSession,
  UserAuthStatus,
} from "../shared/types";
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

  const [categories, setCategories] = useState(CATEGORIES);
  const [services, setServices] = useState(SERVICES);
  const [selectedCategory, setSelectedCategory] = useState(
    CATEGORIES[0]?.name || "All",
  );
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [pendingService, setPendingService] = useState<Service | null>(null);
  const [authStatus, setAuthStatus] = useState<UserAuthStatus>({
    authenticated: false,
    session: null,
    reason: "not_authenticated",
  });

  const filteredServices = useMemo(() => {
    return services.filter((s) => s.category === selectedCategory);
  }, [selectedCategory, services]);

  const buildServiceFlowConfig = useCallback((svc: CategoryService) => {
    const rawFlowConfig = svc.config;
    const rawSteps = rawFlowConfig?.steps;
    if (!Array.isArray(rawSteps) || !rawSteps.length) return undefined;

    const steps = rawSteps
      .map((step) => String(step || "").trim())
      .filter((step) => !!step);

    if (!steps.length) return undefined;

    return {
      serviceId: svc.id,
      steps,
      initialStepData: rawFlowConfig?.initial || {},
    };
  }, []);

  const loadCatalog = useCallback(async () => {
    if (!window.electron?.parcel?.categories || !window.electron?.parcel?.services) {
      return;
    }

    try {
      const rawCategories = await window.electron.parcel.categories();
      if (!Array.isArray(rawCategories) || !rawCategories.length) return;

      const activeCategories = rawCategories.filter(
        (cat) => cat && cat.id != null && cat.status !== false,
      );
      if (!activeCategories.length) return;

      const mappedCategories = activeCategories.map((cat: ServiceCategory) => ({
        id: Number(cat.id),
        name: String(cat.name_mn || cat.name_en || "").trim() || `Category ${cat.id}`,
        icon: cat.icon || "📁",
        desc: cat.desc,
      }));

      const firstCategoryName = mappedCategories[0]?.name || selectedCategory;

      setCategories(mappedCategories);
      setSelectedCategory((prev) =>
        mappedCategories.some((cat) => cat.name === prev)
          ? prev
          : firstCategoryName,
      );

      const rawServices = await Promise.all(
        activeCategories.map((cat) => window.electron.parcel.services(cat.id)),
      );

      const categoryNameById = new Map(
        mappedCategories
          .filter((cat) => cat.id != null)
          .map((cat) => [Number(cat.id), cat.name] as const),
      );

      const mappedServices: Service[] = rawServices
        .flat()
        .filter(
          (svc: CategoryService) => svc && svc.id != null && svc.status !== false,
        )
        .map((svc: CategoryService) => ({
          id: svc.id,
          cat_id: Number(svc.cat_id),
          desc: svc.curl || "",
          category: categoryNameById.get(Number(svc.cat_id)) || mappedCategories[0]?.name || "",
          name: String(svc.name_mn || svc.name_en || "").trim() || `Service ${svc.id}`,
          icon: "🧾",
          price: String(svc.price ?? "0"),
          status: svc.status,
          config: buildServiceFlowConfig(svc),
        }));

      setServices(mappedServices);
    } catch {
      // Keep fallback constants if remote catalog fails.
    }
  }, [buildServiceFlowConfig]);

  const loadAuthStatus = useCallback(async () => {
    if (!window.electron?.auth) return;
    const status = await window.electron.auth.status();
    setAuthStatus(status);
  }, []);

  useEffect(() => {
    void loadAuthStatus();
  }, [loadAuthStatus]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

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

  const handleAuthSuccess = (session: UserAuthSession) => {
    if (!pendingService) return;
    setAuthStatus({
      authenticated: true,
      session,
    });
    setSelectedService(pendingService);
    setPendingService(null);
  };

  const handleSessionExpired = useCallback(() => {
    setSelectedService(null);
    setPendingService(null);
    setAuthStatus({
      authenticated: false,
      session: null,
      reason: "expired",
    });
    void window.electron?.auth?.logout().catch(() => {});
  }, []);

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
          categories={categories}
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
            userClaims={authStatus.session?.claims}
            sessionExpiresAt={authStatus.session?.expiresAt}
            onSessionExpired={handleSessionExpired}
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
