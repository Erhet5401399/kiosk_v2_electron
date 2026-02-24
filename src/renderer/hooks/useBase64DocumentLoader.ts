import { useEffect, useState } from 'react';

interface UseBase64DocumentLoaderParams {
  existingBase64?: string;
  requiredValue?: string;
  fetchDocument: () => Promise<string>;
  onDocumentLoaded?: (base64: string) => void;
  missingRequiredMessage: string;
  emptyResponseMessage: string;
  requestFailedMessage: string;
}

interface UseBase64DocumentLoaderResult {
  base64: string;
  isLoading: boolean;
  error: string | null;
}

export function useBase64DocumentLoader({
  existingBase64,
  requiredValue,
  fetchDocument,
  onDocumentLoaded,
  missingRequiredMessage,
  emptyResponseMessage,
  requestFailedMessage,
}: UseBase64DocumentLoaderParams): UseBase64DocumentLoaderResult {
  const normalizedExisting = String(existingBase64 || '').trim();
  const normalizedRequired = String(requiredValue || '').trim();

  const [base64, setBase64] = useState(normalizedExisting);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!normalizedRequired) {
        setError(missingRequiredMessage);
        setBase64('');
        return;
      }

      if (normalizedExisting) {
        setBase64(normalizedExisting);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchDocument();
        if (!active) return;

        const normalizedResponse = String(response || '').trim();
        if (!normalizedResponse) {
          setBase64('');
          setError(emptyResponseMessage);
          return;
        }

        setBase64(normalizedResponse);
        onDocumentLoaded?.(normalizedResponse);
      } catch (err) {
        if (!active) return;
        setBase64('');
        const errorMessage = (err as Error)?.message || requestFailedMessage;
        setError(errorMessage);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [
    normalizedExisting,
    normalizedRequired,
    fetchDocument,
    onDocumentLoaded,
    missingRequiredMessage,
    emptyResponseMessage,
    requestFailedMessage,
  ]);

  return {
    base64,
    isLoading,
    error,
  };
}
