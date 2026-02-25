import { useCallback, useEffect, useState } from "react";
import type { PromotionEvent, PromotionVideo } from "../../shared/types";

export function usePromotionVideos() {
  const [videos, setVideos] = useState<PromotionVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusText, setStatusText] = useState("Downloading promotion videos...");

  const load = useCallback(async (forceRefresh = false) => {
    if (!window.electron?.promotion) {
      setVideos([]);
      setIsLoading(false);
      setStatusText("No promotion videos available.");
      return;
    }

    setIsLoading(true);
    setStatusText(forceRefresh ? "Updating promotion videos..." : "Downloading promotion videos...");

    try {
      const playlist = forceRefresh
        ? await window.electron.promotion.refresh()
        : await window.electron.promotion.list();

      const nextVideos = playlist.videos || [];
      setVideos(nextVideos);
      setStatusText(nextVideos.length ? "" : "No promotion videos available.");
    } catch {
      setVideos([]);
      setStatusText("Failed to load promotion videos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
    if (!window.electron?.promotion?.onStatus) return;

    const unsubscribe = window.electron.promotion.onStatus((event: PromotionEvent) => {
      setVideos((prev) => {
        const next = event.playlist?.videos;
        if (!Array.isArray(next)) return prev;

        if (JSON.stringify(prev) === JSON.stringify(next)) {
          return prev;
        }

        return next;
      });
      setIsLoading(event.syncing);
      setStatusText(
        event.error
          ? `Promotion update failed: ${event.error}`
          : event.syncing
            ? "Updating promotion videos..."
            : (event.playlist?.videos?.length ? "" : "No promotion videos available."),
      );
    });

    return unsubscribe;
  }, [load]);

  return {
    videos,
    isLoading,
    statusText,
    refreshVideos: () => load(true),
  };
}
