import { api } from "../api";
import { logger } from "../logger";

const log = logger.child("Mocks");
const qpayCheckCounter = new Map<string, number>();

export type MockMode = "all" | "auth";

function parseMockModeFromEnv(raw: string | undefined): MockMode {
  const value = String(raw || "all").trim().toLowerCase();
  return value === "auth" ? "auth" : "all";
}

function registerDeviceAuthMocks() {
  api.registerMock("/api/auth/kiosk/register/login", () => ({
    access_token: "mock-token",
    refresh_token: "mock-refresh",
    expires_at: Date.now() + 3600_000,
  }));

  api.registerMock("/api/auth/kiosk/refresh/token", () => ({
    access_token: "mock-token",
    refresh_token: "mock-refresh",
    expires_at: Date.now() + 3600_000,
  }));
}

function registerConfigMocks() {
  api.registerMock("/device/config", () => ({
    device_name: "Mock Kiosk",
    printer_enabled: true,
    kiosk_mode: true,
    refresh_interval: 30_000,
    maintenance_mode: false,
  }));

  api.registerMock("/api/health", () => ({ status: "ok" }));
}

function registerCatalogMocks() {
  api.registerMock("/api/kiosk/service/category/tree", () => [
    {
      id: 1,
      name_mn: "e-mongolia",
      name_en: "e-mongolia",
      status: true,
      service: [],
    },
    {
      id: 3,
      name_mn: "Газрын үйлчилгээ",
      name_en: "Land services",
      status: true,
      service: [
        {
          id: 6,
          cat_id: 3,
          name_mn: "Үнэгүй газар өмчилсөн эсэх лавлагаа",
          name_en: "",
          curl: "/ref/owner",
          amount: 0,
          paid: true,
          status: true,
          flow_config: {
            initial_step_data: {
              map_type: "cadastral",
            },
            steps: [
              { id: "registration-input", title: "Рд оруулах" },
              { id: "land-parcel-select", title: "Нэгж талбар сонгох" },
              { id: "payment-method", title: "Төлбөрийн нөхцөл" },
              { id: "payment-processing", title: "Төлбөр төлөлт" },
              { id: "success", title: "Амжилттай" },
            ],
          },
        },
      ],
    },
  ]);
}

function registerParcelMocks() {
  api.registerMock("/api/kiosk/service/active/all/parcel", (_, url) => {
    const parsed = new URL(url, "http://localhost");
    const reg = String(parsed.searchParams.get("reg") || "")
      .trim()
      .toUpperCase();

    const parcels = [
      {
        parcel: "1101010101001",
        app_id: "APP-2026-0001",
        app_no: "0001",
        property_no: "PROP-1001",
        status_code: "APPROVED",
        app_timestamp: "2026-02-10T09:30:00Z",
        app_type_code: "OWNERSHIP",
        app_type_name: "Ownership Certificate",
        status_desc: "Approved",
        right_type_desc: "Ownership",
        au1_name: "Ulaanbaatar",
        approved_landuse: "Residential",
        au2_name: "Sukhbaatar",
        area_m2: "640",
        valid_from: "2025-01-01",
        valid_till: "2030-01-01",
        person_register: "AA00112233",
      },
      {
        parcel: "1101010102002",
        app_id: "APP-2026-0002",
        app_no: "0002",
        property_no: "PROP-1002",
        status_code: "PROCESSING",
        app_timestamp: "2026-02-11T12:15:00Z",
        app_type_code: "LEASE",
        app_type_name: "Lease Confirmation",
        status_desc: "Processing",
        right_type_desc: "Lease",
        au1_name: "Ulaanbaatar",
        approved_landuse: "Commercial",
        au2_name: "Bayangol",
        area_m2: "1200",
        valid_from: "2024-06-01",
        valid_till: "2029-06-01",
        person_register: "BB99001122",
      },
      {
        parcel: "1101010103003",
        app_id: "APP-2026-0003",
        app_no: "0003",
        property_no: "PROP-1003",
        status_code: "REJECTED",
        app_timestamp: "2026-02-12T07:50:00Z",
        app_type_code: "BOUNDARY",
        app_type_name: "Boundary Verification",
        status_desc: "Rejected",
        right_type_desc: "Possession",
        au1_name: "Darkhan",
        approved_landuse: "Industrial",
        au2_name: "Darkhan-Uul",
        area_m2: "2500",
        valid_from: "2023-03-15",
        valid_till: "2028-03-15",
        person_register: "CC55443322",
      },
    ];

    if (!reg) return parcels;
    return parcels.filter(
      (item) => String(item.person_register || "").trim().toUpperCase() === reg,
    );
  });
}

function registerPaymentMocks() {
  qpayCheckCounter.clear();

  api.registerMock("/api/payment/qpay/invoice", (_, __, body) => {
    const payload = (body || {}) as { amount?: number; serviceId?: number };
    const invoiceId = `INV-${Date.now()}`;
    qpayCheckCounter.set(invoiceId, 0);

    return {
      invoiceId,
      qrText: `qpay://invoice/${invoiceId}`,
      amount: Number(payload.amount || 0),
      status: "CREATED",
      deeplink: `qpay://pay?invoice=${invoiceId}&service=${String(payload.serviceId || "")}`,
    };
  });

  api.registerMock("/api/payment/qpay/invoice/check", (_, __, body) => {
    const payload = (body || {}) as { invoiceId?: string };
    const invoiceId = String(payload.invoiceId || "").trim();
    const currentCount = qpayCheckCounter.get(invoiceId) || 0;
    const nextCount = currentCount + 1;
    qpayCheckCounter.set(invoiceId, nextCount);

    const paid = nextCount >= 2;
    return {
      paid,
      status: paid ? "PAID" : "PENDING",
      paidAt: paid ? new Date().toISOString() : undefined,
    };
  });
}

function registerPromotionMocks() {
  api.registerMock("/api/kiosk/promotion/videos", () => ({
    version: "mock-v1",
    videos: [
      {
        id: "promo-1",
        title: "Kiosk Promo 1",
        src: "https://www.pexels.com/download/video/33448185/",
        mimeType: "video/mp4",
        active: true,
        order: 1,
      },
      {
        id: "promo-2",
        title: "Kiosk Promo 2",
        src: "https://www.pexels.com/download/video/5642531/",
        mimeType: "video/mp4",
        active: true,
        order: 2,
      },
    ],
  }));
}

function registerUserAuthMocks() {
  api.registerMock("/auth/user/dan/start", (_, __, body) => {
    const challengeId = String(
      (body as { challengeId?: string })?.challengeId || "",
    ).trim();
    if (!challengeId) {
      throw new Error("Missing challengeId");
    }

    const callbackUrl = "https://kiosk.local/auth/dan/callback";

    return {
      auth_url: "https://sso.gov.mn/",
      callback_url: callbackUrl,
      expires_at: Date.now() + 5 * 60 * 1000,
      mock: true,
    };
  });

  api.registerMock("/auth/user/dan/finalize", (_, __, body) => {
    const req = (body || {}) as {
      challengeId?: string;
      callbackUrl?: string;
      expectedCallbackUrl?: string;
    };

    const challengeId = String(req.challengeId || "").trim();
    const callbackUrl = String(req.callbackUrl || "").trim();
    const expectedCallbackUrl = String(req.expectedCallbackUrl || "").trim();

    if (!challengeId || !callbackUrl) {
      throw new Error("Missing finalize payload");
    }
    if (expectedCallbackUrl && !callbackUrl.startsWith(expectedCallbackUrl)) {
      throw new Error("Invalid callback URL");
    }

    const callback = new URL(callbackUrl);
    const status = String(callback.searchParams.get("status") || "");
    const challengeFromCallback = String(
      callback.searchParams.get("challenge") || "",
    );
    const code = String(callback.searchParams.get("code") || "");

    if (status !== "1") {
      throw new Error("DAN authentication failed");
    }
    if (challengeFromCallback !== challengeId) {
      throw new Error("Invalid DAN challenge");
    }
    if (!code) {
      throw new Error("Missing DAN authorization code");
    }

    return {
      register_number: "AA00112233",
      claims: {
        regnum: "AA00112233",
        reghash: "9a3dee68asd23",
        image: "",
        firstname: "John",
        lastname: "Doe",
        address: "Sample Address",
        personId: "",
        phone: "",
        code,
        provider: "DAN",
        mock: true,
      },
    };
  });

  api.registerMock("/api/kiosk/service/register/phone/check", (_, url) => {
    const parsed = new URL(url, "http://localhost");
    const registerNumber = String(parsed.searchParams.get("register_number") || "")
      .trim()
      .toUpperCase();
    const phoneNumber = String(parsed.searchParams.get("phone_number") || "")
      .trim();

    if (!registerNumber || !phoneNumber) {
      throw new Error("Missing register_number or phone_number");
    }

    return {
      status: true,
      msg: "ok",
      data: {
        register_number: registerNumber,
        phone_number: phoneNumber,
      },
    };
  });

  api.registerMock("/api/kiosk/service/confirm/sms/send", (_, url) => {
    const parsed = new URL(url, "http://localhost");
    const registerNumber = String(parsed.searchParams.get("register_number") || "")
      .trim()
      .toUpperCase();
    const phoneNumber = String(parsed.searchParams.get("phone_number") || "")
      .trim();

    if (!registerNumber || !phoneNumber) {
      throw new Error("Missing register_number or phone_number");
    }

    return {
      status: true,
      msg: "sent",
      data: {
        sent: true,
        register_number: registerNumber,
        phone_number: phoneNumber,
        mock_code: "123456",
      },
    };
  });

  api.registerMock("/api/kiosk/service/auth/login/check", (_, url) => {
    const parsed = new URL(url, "http://localhost");
    const registerNumber = String(parsed.searchParams.get("register_number") || "")
      .trim()
      .toUpperCase();
    const phoneNumber = String(parsed.searchParams.get("phone_number") || "")
      .trim();
    const sendCode = String(parsed.searchParams.get("send_code") || "").trim();

    if (!registerNumber || !phoneNumber || !sendCode) {
      throw new Error("Missing SMS login fields");
    }
    if (sendCode !== "123456") {
      throw new Error("Invalid SMS code");
    }

    return {
      status: true,
      msg: "verified",
      data: {
        register_number: registerNumber,
        claims: {
          provider: "SMS",
          phone: phoneNumber,
          mock: true,
        },
      },
    };
  });
}

export function registerMocks(options?: { mode?: MockMode }) {
  api.clearMocks();
  qpayCheckCounter.clear();

  const mode = options?.mode || parseMockModeFromEnv(process.env.MOCK_MODE);

  if (mode === "auth") {
    registerPromotionMocks();
    registerUserAuthMocks();
    log.info("Mocks registered", { mode, mocked: ["promotion", "user_auth"] });
    return mode;
  }

  registerDeviceAuthMocks();
  registerConfigMocks();
  registerCatalogMocks();
  registerParcelMocks();
  registerPaymentMocks();
  registerPromotionMocks();
  registerUserAuthMocks();
  log.info("Mocks registered", {
    mode,
    mocked: ["device_auth", "config", "catalog", "parcel", "payment", "promotion", "user_auth"],
  });
  return mode;
}

export function clearAllMocks() {
  api.clearMocks();
  qpayCheckCounter.clear();
  log.info("All mocks cleared");
}
