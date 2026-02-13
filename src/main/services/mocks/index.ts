import { api } from "../api";
import { logger } from "../logger";

const log = logger.child("Mocks");

export function registerMocks() {
  // api.registerMock("/api/auth/kiosk/register/login", () => ({
  //   access_token: "mock-token",
  //   refresh_token: "mock-refresh",
  //   expires_at: Date.now() + 3600_000,
  // }));

  // api.registerMock("/api/auth/kiosk/refresh/token", () => ({
  //   access_token: "mock-token",
  //   refresh_token: "mock-refresh",
  //   expires_at: Date.now() + 3600_000,
  // }));

  api.registerMock("/device/config", () => ({
    device_name: "Mock Kiosk",
    printer_enabled: true,
    kiosk_mode: true,
    refresh_interval: 30_000,
    maintenance_mode: false,
  }));

  api.registerMock("/health", () => ({ status: "ok" }));

  api.registerMock("/api/category", () => [
    { id: 1, name_mn: "e-mongolia", name_en: "e-mongolia", status: true },
    { id: 2, name_mn: "land", name_en: "land", status: true },
  ]);

  api.registerMock("/api/category/services", (_, url) => {
    const parsed = new URL(url, "http://localhost");
    const catId = Number(parsed.searchParams.get("cat_id") || 0);

    const byCategory: Record<number, unknown[]> = {
      1: [
        {
          id: 11,
          name_mn: "Service A",
          name_en: "Service A",
          curl: "/pqrcode/a",
          price: 5000,
          status: true,
          cat_id: 1,
          config: {
            steps: [
              "land-parcel-select",
              "payment-method",
              "payment-processing",
              "success",
            ],
            initial: {
              map_type: "cadastral",
            },
          },
        },
      ],
      2: [
        {
          id: 21,
          name_mn: "Service B",
          name_en: "Service B",
          curl: "/pqrcode/b",
          price: 3000,
          status: true,
          cat_id: 2,
          config: {
            steps: [
              "document-type-select",
              "payment-method",
              "payment-processing",
              "success",
            ],
          },
        },
      ],
    };

    return byCategory[catId] || [];
  });

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

  log.info("Mocks registered");
}

export function clearAllMocks() {
  api.clearMocks();
  log.info("All mocks cleared");
}
