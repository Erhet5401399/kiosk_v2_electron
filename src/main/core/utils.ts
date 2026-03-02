export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number) {
  let timer: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delay = 1000,
  multiplier = 2
): Promise<T> {
  let lastError: unknown;
  let currentDelay = delay;

  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts) {
        await sleep(currentDelay);
        currentDelay *= multiplier;
      }
    }
  }
  throw lastError;
}

export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const asList = <T>(payload: unknown): T[] =>
  Array.isArray(payload)
    ? (payload as T[])
    : Array.isArray((payload as { data?: unknown[] } | null)?.data)
      ? ((payload as { data: T[] }).data)
      : [];

export const unwrapData = <T>(payload: unknown): T | null => {
  if (!payload) return null;
  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    (payload as { data?: unknown }).data
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};