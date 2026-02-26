import { useCallback, useEffect, useState } from "react";
import type { PromotionEvent, PromotionVideo } from "../../shared/types";

export function usePromotionVideos() {
  const [videos, setVideos] = useState<PromotionVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusText, setStatusText] = useState("Downloading promotion videos...");

  const normalizeVideos = useCallback((input: PromotionVideo[] | null | undefined) => {
    if (!Array.isArray(input)) return [];
    return input.filter((video) => Boolean(String(video?.src || "").trim()));
  }, []);

  const areVideosEqual = useCallback((a: PromotionVideo[], b: PromotionVideo[]) => {
    if (a.length !== b.length) return false;
    return a.every((video, index) => {
      const next = b[index];
      return (
        video.id === next.id &&
        video.src === next.src &&
        video.updatedAt === next.updatedAt &&
        video.order === next.order
      );
    });
  }, []);

  const applyEventState = useCallback((event: PromotionEvent) => {
    const nextVideos = normalizeVideos(event.playlist?.videos);
    setVideos((prev) => (areVideosEqual(prev, nextVideos) ? prev : nextVideos));
    setIsLoading(event.syncing);
    if (event.error) {
      setStatusText(`Promotion update failed: ${event.error}`);
      return;
    }
    setStatusText(event.syncing ? "Updating promotion videos..." : nextVideos.length ? "" : "No promotion videos available.");
  }, [areVideosEqual, normalizeVideos]);

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

      const nextVideos = normalizeVideos(playlist.videos);
      setVideos(nextVideos);
      setStatusText(nextVideos.length ? "" : "No promotion videos available.");
    } catch {
      setVideos([]);
      setStatusText("Failed to load promotion videos.");
    } finally {
      setIsLoading(false);
    }
  }, [normalizeVideos]);

  useEffect(() => {
    let active = true;

    void load(false);
    if (!window.electron?.promotion?.onStatus) return;

    const unsubscribe = window.electron.promotion.onStatus((event: PromotionEvent) => {
      if (!active) return;
      applyEventState(event);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [applyEventState, load]);

  return {
    videos,
    isLoading,
    statusText,
    refreshVideos: () => load(true),
  };
}
