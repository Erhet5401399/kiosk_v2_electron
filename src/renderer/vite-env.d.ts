interface Window {
  electron: {
    getDeviceStatus: () => Promise<{ registered: boolean; deviceId: string }>;
    authenticate: () => Promise<{ success: boolean; token?: string; error?: string }>;
    print: (text: string) => Promise<string>;
  };
}