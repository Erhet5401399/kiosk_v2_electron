import { useEffect, useState, useCallback } from 'react';
import type { UpdateStatus } from '../../shared/types';

const INITIAL_UPDATER_STATUS: UpdateStatus = {
  state: 'idle',
  currentVersion: '0.0.0',
  mock: false,
};

export function useUpdater() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(INITIAL_UPDATER_STATUS);

  useEffect(() => {
    if (!window.electron?.updater) return;

    let active = true;

    window.electron.updater
      .getStatus()
      .then((status) => {
        if (active) setUpdateStatus(status);
      })
      .catch(() => {
        if (!active) return;
        setUpdateStatus((prev) => ({
          ...prev,
          state: 'error',
          error: 'Failed to load updater status',
        }));
      });

    const unsubscribe = window.electron.updater.onStatus((status) => {
      if (active) setUpdateStatus(status);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!window.electron?.updater) return;

    try {
      const status = await window.electron.updater.check();
      setUpdateStatus(status);
    } catch {
      setUpdateStatus((prev) => ({
        ...prev,
        state: 'error',
        error: 'Update check failed',
      }));
    }
  }, []);

  return { updateStatus, checkForUpdates };
}
