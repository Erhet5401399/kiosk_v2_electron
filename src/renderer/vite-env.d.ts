interface Window {
  electron: {
    getRuntimeSnapshot: () => Promise<{
      state: "loading" | "unregistered" | "authenticating" | "ready" | "error";
      deviceId: string;
      error?: string;
    }>;

    onRuntimeState: (
      callback: (snapshot: {
        state: "loading" | "unregistered" | "authenticating" | "ready" | "error";
        deviceId: string;
        error?: string;
      }) => void
    ) => () => void;
  };
}