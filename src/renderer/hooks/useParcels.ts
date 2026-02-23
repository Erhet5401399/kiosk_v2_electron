import { useState, useEffect, useCallback } from 'react';
import type { Parcel } from '../../shared/types';

interface UseParcelsProps {
  register: string;
}

export function useParcels({ register }: UseParcelsProps) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParcels = useCallback(async () => {
    const normalizedRegister = String(register || "").trim();
    if (!normalizedRegister) {
      setParcels([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!window.electron?.parcel?.list) {
        throw new Error('Electron IPC not available');
      }

      const response = await window.electron.parcel.list(normalizedRegister);

      if (response) {
        setParcels(response);
      } else {
        setError('Unknown error');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch parcels');
    } finally {
      setIsLoading(false);
    }
  }, [register]);

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  return {
    parcels,
    isLoading,
    error,
    refetch: fetchParcels,
  };
}
