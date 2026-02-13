// vite-env.d.ts
import type {
  CategoryService,
  Parcel,
  RuntimeSnapshot,
  ServiceCategory,
  UpdateStatus,
  UserAuthChallenge,
  UserAuthMethod,
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
        print: (req: { content: string }) => Promise<string>;
        list: () => Promise<string[]>;
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
        categories: () => Promise<ServiceCategory[]>;
        services: (catId: number) => Promise<CategoryService[]>;
      };
      auth: {
        listMethods: () => Promise<UserAuthMethod[]>;
        start: (methodId: string) => Promise<UserAuthChallenge>;
        verify: (req: UserAuthVerifyRequest) => Promise<UserAuthStatus>;
        status: () => Promise<UserAuthStatus>;
        touch: () => Promise<UserAuthStatus>;
        logout: () => Promise<UserAuthStatus>;
      },
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
