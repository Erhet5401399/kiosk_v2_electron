interface Window {
  electron: {
    authenticate: () => Promise<{ success: boolean; token?: string; error?: string }>;
    print: (text: string) => Promise<string>;
  };
}