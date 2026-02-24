import { useEffect, useState } from 'react';
import { INITIAL_SNAPSHOT } from '../constants';
import type { RuntimeSnapshot } from '../../shared/types';

type PrintResponse = { success?: boolean; jobId?: string; error?: string };

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
      throw new Error(result.error || 'Printing failed');
    }

    return result?.jobId;
  };

  return { snapshot, handlePrint };
}
