export type IpcSuccess<T> = { ok: true; data: T };
export type IpcFailure = { ok: false; error: string };
export type IpcResult<T> = IpcSuccess<T> | IpcFailure;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  const message = String((error as { message?: unknown })?.message || "").trim();
  return message || fallback;
}

export function ipcOk<T>(data: T): IpcSuccess<T> {
  return { ok: true, data };
}

export function ipcFail(error: unknown, fallback = "Request failed"): IpcFailure {
  return { ok: false, error: errorMessage(error, fallback) };
}

export async function ipcWrap<T>(
  fn: () => Promise<T> | T,
  fallback = "Request failed",
): Promise<IpcResult<T>> {
  try {
    return ipcOk(await fn());
  } catch (error) {
    return ipcFail(error, fallback);
  }
}
