import { useEffect, useState } from 'react';
import { INITIAL_SNAPSHOT } from '../constants';
import type { RuntimeSnapshot } from '../../shared/types';

export function useElectron() {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>(INITIAL_SNAPSHOT as RuntimeSnapshot);

  useEffect(() => {
    if (window.electron) {
      window.electron.runtime.getSnapshot().then(setSnapshot);
      const unsubscribe = window.electron.runtime.onUpdate(setSnapshot);
      return unsubscribe;
    } else {
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
        3000
      );
    }
  }, []);

  const handlePrint = async (content: string) => {
    if (window.electron) {
      await window.electron.printer.print({ content });
    } else {
      alert('Баримт хэвлэх команд илгээгдлээ!');
    }
  };

  return { snapshot, handlePrint };
}
