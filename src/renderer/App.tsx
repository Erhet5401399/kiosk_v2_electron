import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type {
  CategoryService,
  PrinterDevice,
  ServiceCategory,
  UserAuthSession,
  UserAuthStatus,
} from "../shared/types";
import type {
  Category,
  Service,
  ServiceFlowConfig,
  ServiceFlowStep,
  DocumentRequestConfig,
} from "./types";
import { STATE_LABELS } from "./constants";
import { useElectron, usePromotionVideos, useUpdater } from "./hooks";
import {
  PromoSection,
  Sidebar,
  LoadingScreen,
  StatusBar,
} from "./components/layout";
import { ServiceList } from "./components/service";
import { PromotionModal, ServiceModal } from "./components/modal";
import { hasStepDefinition } from "./flows";
import { buildPrintableHtmlFromBase64, detectBase64ContentKind } from "./utils";
import "./styles/index.css";

const IDLE_PROMOTION_MS = Number(import.meta.env.VITE_PROMOTION_IDLE_MS || 23_000);

export default function App() {
  const { snapshot, handlePrint } = useElectron();
  const { updateStatus, checkForUpdates } = useUpdater();
  const {
    videos: promotionVideos,
    isLoading: isPromotionLoading,
    statusText: promotionStatusText,
  } = usePromotionVideos();

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [lastInteractionAt, setLastInteractionAt] = useState(() => Date.now());
  const [authStatus, setAuthStatus] = useState<UserAuthStatus>({
    authenticated: false,
    session: null,
    reason: "not_authenticated",
  });
  const idleLogoutDoneRef = useRef(false);
  const ignoreServiceTapUntilRef = useRef(0);
  const [connectedPrinterName, setConnectedPrinterName] = useState<string>("");
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const hasBlockingModal = Boolean(selectedService);

  const filteredServices = useMemo(() => {
    if (!selectedCategory) return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [selectedCategory, services]);

  const categoryServiceCount = useMemo(() => {
    return services.reduce<Record<string, number>>((acc, service) => {
      const categoryName = String(service.category || "").trim();
      if (!categoryName) return acc;
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {});
  }, [services]);

  const buildServiceFlowConfig = useCallback((svc: CategoryService): ServiceFlowConfig => {
    const rawFlowConfig = svc.flow_config || svc.config;
    const rawSteps = rawFlowConfig?.steps;
    const rawInitialStepData = (
      svc.flow_config?.initial_step_data || svc.config?.initial || {}
    ) as Record<string, unknown>;

    const toUnavailableFlow = (reason: string): ServiceFlowConfig => ({
      serviceId: svc.id,
      steps: ["service-unavailable"],
      initialStepData: {
        ...rawInitialStepData,
        unavailableReason: reason,
      },
    });

    if (!Array.isArray(rawSteps) || !rawSteps.length) {
      return toUnavailableFlow("Сервисийн тохиргоо буруу байна.");
    }

    const steps: ServiceFlowStep[] = ["auth-gate"];
    for (const rawStep of rawSteps) {
      if (typeof rawStep === "string") {
        const id = rawStep.trim();
        if (id) {
          steps.push(id);
        }
        continue;
      }

      const id = String(rawStep?.id || "").trim();
      if (!id) continue;

      const title = String(rawStep?.title || "").trim();
      const rawDocument = rawStep?.document;
      const document: DocumentRequestConfig | undefined = (
        rawDocument &&
        typeof rawDocument === "object" &&
        !Array.isArray(rawDocument) &&
        typeof rawDocument.endpoint === "string"
      ) ? {
        endpoint: rawDocument.endpoint,
        ...(rawDocument.method === "GET" || rawDocument.method === "POST"
          ? { method: rawDocument.method }
          : {}),
        ...(rawDocument.params &&
        Array.isArray(rawDocument.params)
          ? {
            params: rawDocument.params
              .map((param) => String(param || "").trim())
              .filter((param) => param.length > 0),
          }
          : {}),
      } : undefined;

      if (title || document) {
        steps.push({
          id,
          ...(title ? { title } : {}),
          ...(document ? { document } : {}),
        });
      } else {
        steps.push(id);
      }
    }

    if (!steps.length) {
      return toUnavailableFlow("Flow steps are empty.");
    }

    const unknownStep = steps
      .map((step) => (typeof step === "string" ? step : step.id))
      .find((stepId) => !hasStepDefinition(stepId));
    if (unknownStep) {
      return toUnavailableFlow(`Unknown flow step: ${unknownStep}`);
    }

    return {
      serviceId: svc.id,
      steps,
      initialStepData: rawInitialStepData,
    };
  }, []);

  const loadCatalog = useCallback(async () => {
    if (!window.electron?.parcel?.categories) {
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

      const categoryNameById = new Map(
        mappedCategories
          .filter((cat) => cat.id != null)
          .map((cat) => [Number(cat.id), cat.name] as const),
      );

      const mappedServices: Service[] = activeCategories
        .flatMap((cat) =>
          Array.isArray(cat.service)
            ? cat.service.map((svc) => ({
                ...svc,
                cat_id: Number(svc.cat_id ?? cat.id),
              }))
            : [],
        )
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
          price: String(svc.amount ?? svc.price ?? "0"),
          status: svc.status,
          config: buildServiceFlowConfig(svc),
        }));

      setServices(mappedServices);
    } catch {
      // Keep fallback constants if remote catalog fails.
    }
  }, [buildServiceFlowConfig, selectedCategory]);

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
    if (!window.electron?.printer?.list) return;

    let active = true;
    const lexmarkPattern = /\bLexmark\b/i;

    const pickPrinter = (printers: PrinterDevice[]): PrinterDevice | null => {
      return (
        printers.find((printer) => lexmarkPattern.test(String(printer.name || ""))) ||
        printers.find((printer) => printer.isDefault) ||
        printers[0] ||
        null
      );
    };

    const refreshPrinters = async () => {
      try {
        const printers = await window.electron.printer.list();
        if (!active) return;
        const selected = pickPrinter(Array.isArray(printers) ? printers : []);
        setConnectedPrinterName(selected?.name || "");
        setIsPrinterConnected(Boolean(selected));
      } catch {
        if (!active) return;
        setConnectedPrinterName("");
        setIsPrinterConnected(false);
      }
    };

    void refreshPrinters();
    const timer = window.setInterval(() => {
      void refreshPrinters();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

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

  useEffect(() => {
    const registerActivity = () => {
      setLastInteractionAt(Date.now());
      setShowPromotionModal(false);
    };

    window.addEventListener("pointerdown", registerActivity);
    window.addEventListener("keydown", registerActivity);
    window.addEventListener("touchstart", registerActivity);

    return () => {
      window.removeEventListener("pointerdown", registerActivity);
      window.removeEventListener("keydown", registerActivity);
      window.removeEventListener("touchstart", registerActivity);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (hasBlockingModal) return;
      if (Date.now() - lastInteractionAt < IDLE_PROMOTION_MS) return;
      setShowPromotionModal(true);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasBlockingModal, lastInteractionAt]);

  useEffect(() => {
    if (hasBlockingModal) {
      setShowPromotionModal(false);
    }
  }, [hasBlockingModal]);

  useEffect(() => {
    if (!showPromotionModal || hasBlockingModal) {
      idleLogoutDoneRef.current = false;
      return;
    }
    if (idleLogoutDoneRef.current) return;
    idleLogoutDoneRef.current = true;

    if (!window.electron?.auth) return;
    void window.electron.auth.logout().then(setAuthStatus).catch(() => {});
  }, [hasBlockingModal, showPromotionModal]);

  const dismissPromotionModal = useCallback(() => {
    // Guard against touch "tap-through" on kiosk devices after closing promotion overlay.
    ignoreServiceTapUntilRef.current = Date.now() + 450;
    setLastInteractionAt(Date.now());
    setShowPromotionModal(false);
  }, []);

  const handleServiceSelect = async (service: Service) => {
    if (Date.now() < ignoreServiceTapUntilRef.current) {
      return;
    }
    dismissPromotionModal();
    setSelectedService(service);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setLastInteractionAt(Date.now());
    setShowPromotionModal(false);
  };

  const handleAuthSuccess = (session: UserAuthSession) => {
    setAuthStatus({
      authenticated: true,
      session,
    });
    setLastInteractionAt(Date.now());
    setShowPromotionModal(false);
  };

  const handleSessionExpired = useCallback(() => {
    setSelectedService(null);
    setAuthStatus({
      authenticated: false,
      session: null,
      reason: "expired",
    });
    void window.electron?.auth?.logout().catch(() => {});
    setLastInteractionAt(Date.now());
    setShowPromotionModal(false);
  }, []);

  const handlePrintAndClose = async (
    registerNumber: string,
    documentBase64?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!selectedService) {
      return { success: false, error: "Service not selected." };
    }

    try {
      const normalizedDocument = String(documentBase64 || "").trim();
      if (normalizedDocument) {
        const docKind = detectBase64ContentKind(normalizedDocument);
        if (docKind === "pdf") {
          await handlePrint(normalizedDocument, "pdf_base64");
        } else {
          const printableHtml = buildPrintableHtmlFromBase64(normalizedDocument);
          await handlePrint(printableHtml, "html");
        }
      } else {
        await handlePrint(
          `Service: ${selectedService.name}\nRegister: ${registerNumber}\nPrice: ${selectedService.price}`,
          "text",
        );
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message || "Printing failed." };
    }
  };

  if (snapshot.state !== "ready") {
    return <LoadingScreen state={snapshot.state} deviceId={snapshot.deviceId} />;
  }

  return (
    <div className="screen">
      <PromoSection paused={showPromotionModal || hasBlockingModal} />

      <div className="content sidebar-layout">
        <Sidebar
          categories={categories}
          selectedCategory={selectedCategory}
          categoryServiceCount={categoryServiceCount}
          onSelectCategory={setSelectedCategory}
        />
        <ServiceList
          services={filteredServices}
          onSelectService={handleServiceSelect}
        />
      </div>

      {showPromotionModal && !hasBlockingModal && (
        <PromotionModal
          videos={promotionVideos}
          isLoading={isPromotionLoading}
          statusText={promotionStatusText}
          onGetStarted={dismissPromotionModal}
        />
      )}

      {selectedService && (
        <ServiceModal
          service={selectedService}
          registerNumber={authStatus.session?.registerNumber || ""}
          userClaims={authStatus.session?.claims}
          sessionExpiresAt={authStatus.session?.expiresAt}
          onSessionExpired={handleSessionExpired}
          onAuthSuccess={handleAuthSuccess}
          onPrint={handlePrintAndClose}
          onClose={handleCloseModal}
        />
      )}

      <StatusBar
        deviceState={STATE_LABELS[snapshot.state]}
        deviceId={snapshot.deviceId}
        printerLabel={connectedPrinterName}
        printerConnected={isPrinterConnected}
        updaterStatus={updateStatus}
        onUpdateCheck={checkForUpdates}
      />
    </div>
  );
}
