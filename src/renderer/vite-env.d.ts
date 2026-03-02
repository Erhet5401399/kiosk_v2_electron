// vite-env.d.ts
import type {
  CheckQpayInvoiceRequest,
  CheckQpayInvoiceResponse,
  CreateQpayInvoiceRequest,
  CreateQpayInvoiceResponse,
  Parcel,
  ParcelRequest,
  PrinterDevice,
  PrintJobStatus,
  PromotionEvent,
  PromotionPlaylist,
  RuntimeSnapshot,
  ServiceCategory,
  UpdateStatus,
  UserAuthChallenge,
  UserAuthMethod,
  UserAuthStartRequest,
  UserAuthStatus,
  UserAuthVerifyRequest,
} from "../shared/types";

export {};

declare global {
  interface Window {
    electron: {
      runtime: {
        getSnapshot: () => Promise<RuntimeSnapshot>;
        onUpdate: (callback: (snapshot: RuntimeSnapshot) => void) => () => void;
        retry: () => Promise<void>;
        reset: () => Promise<void>;
      };
      config: {
        get: () => Promise<any>;
        refresh: () => Promise<void>;
      };
      printer: {
        print: (req: {
          content: string;
          type?: "html" | "text" | "pdf" | "pdf_base64";
          copies?: number;
          priority?: "low" | "normal" | "high";
        }) => Promise<{
          success: boolean;
          jobId?: string;
          error?: string;
        }>;
        list: () => Promise<PrinterDevice[]>;
        getJobStatus: (jobId: string) => Promise<PrintJobStatus | null>;
        onJobStatus: (callback: (status: PrintJobStatus) => void) => () => void;
      };
      health: {
        getStatus: () => Promise<any>;
      };
      updater: {
        getStatus: () => Promise<UpdateStatus>;
        check: () => Promise<UpdateStatus>;
        install: () => Promise<boolean>;
        onStatus: (callback: (status: UpdateStatus) => void) => () => void;
      };
      parcel: {
        list: (register: string) => Promise<Parcel[]>;
        requestList: (register: string) => Promise<ParcelRequest[]>; 
        categories: () => Promise<ServiceCategory[]>;
      };
      service: {
        getDocument: (request: {
          endpoint: string;
          method?: "GET" | "POST";
          params?: Record<string, unknown>;
        }) => Promise<string>;
      };
      promotion: {
        list: () => Promise<PromotionPlaylist>;
        refresh: () => Promise<PromotionPlaylist>;
        onStatus: (callback: (status: PromotionEvent) => void) => () => void;
      };
      auth: {
        listMethods: () => Promise<UserAuthMethod[]>;
        start: (req: UserAuthStartRequest) => Promise<UserAuthChallenge>;
        verify: (req: UserAuthVerifyRequest) => Promise<UserAuthStatus>;
        status: () => Promise<UserAuthStatus>;
        touch: () => Promise<UserAuthStatus>;
        logout: () => Promise<UserAuthStatus>;
      },
      payment: {
        createQpayInvoice: (
          req: CreateQpayInvoiceRequest,
        ) => Promise<CreateQpayInvoiceResponse | null>;
        checkQpayInvoice: (
          req: CheckQpayInvoiceRequest,
        ) => Promise<CheckQpayInvoiceResponse>;
      };
      platform: {
        isElectron: boolean;
        platform: NodeJS.Platform;
        version: string;
      };
    };
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      src?: string;
      partition?: string;
      allowpopups?: string;
    };
  }
}
