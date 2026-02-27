import { useEffect, useState } from 'react';
import { INITIAL_SNAPSHOT } from '../constants';
import type { PrintJobStatus, RuntimeSnapshot } from '../../shared/types';

type PrintResponse = { success?: boolean; jobId?: string; error?: string };
const TERMINAL_STATES = new Set<PrintJobStatus['status']>([
  'completed',
  'failed',
  'cancelled',
]);
const PRINT_ERROR = 'Хэвлэх үед алдаа гарлаа. Хэвлэх төхөөрөмжийг шалгана уу.';

export function useElectron() {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>(
    INITIAL_SNAPSHOT as RuntimeSnapshot,
  );

  useEffect(() => {
    if (window.electron) {
      window.electron.runtime.getSnapshot().then(setSnapshot);
      const unsubscribe = window.electron.runtime.onUpdate(setSnapshot);
      return unsubscribe;
    }

    setTimeout(() => setSnapshot((prev) => ({ ...prev, state: 'booting' })), 1000);
    setTimeout(
      () =>
        setSnapshot((prev) => ({
          ...prev,
          state: 'ready',
          deviceId: 'KIOSK-001',
          uptime: 10,
          startedAt: Date.now(),
        })),
      3000,
    );
  }, []);

  const waitForPrintJob = async (jobId: string, timeoutMs = 120000): Promise<void> => {
    if (!window.electron?.printer?.onJobStatus || !window.electron?.printer?.getJobStatus) {
      return;
    }

    const initial = await window.electron.printer.getJobStatus(jobId);
    if (initial && TERMINAL_STATES.has(initial.status)) {
      if (initial.status === 'completed') return;
      throw new Error(PRINT_ERROR);
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        unsubscribe();
        reject(new Error(PRINT_ERROR));
      }, timeoutMs);

      const unsubscribe = window.electron.printer.onJobStatus((status) => {
        if (!status || status.id !== jobId) return;
        if (!TERMINAL_STATES.has(status.status)) return;

        window.clearTimeout(timeout);
        unsubscribe();

        if (status.status === 'completed') {
          resolve();
          return;
        }

        reject(new Error(PRINT_ERROR));
      });
    });
  };

  const handlePrint = async (
    content: string,
    type: "html" | "text" | "pdf" | "pdf_base64" = "html",
  ): Promise<string | undefined> => {
    if (!window.electron) {
      alert('Баримт хэвлэх команд илгээгдлээ!');
      return undefined;
    }

    const result = (await window.electron.printer.print({
      content,
      type,
    })) as PrintResponse;

    if (result?.success === false) {
      throw new Error(PRINT_ERROR);
    }

    if (!result?.jobId) {
      throw new Error(PRINT_ERROR);
    }

    await waitForPrintJob(result.jobId);
    return result.jobId;
  };

  return { snapshot, handlePrint };
}
