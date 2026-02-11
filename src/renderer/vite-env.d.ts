// vite-env.d.ts
import type { Parcel, RuntimeSnapshot, UpdateStatus } from "../shared/types";

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
      },
      platform: {
        isElectron: boolean;
        platform: NodeJS.Platform;
        version: string;
      };
    };
  }
}
