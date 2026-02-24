import { useCallback, useEffect, useState } from "react";
import type { PromotionVideo } from "../../shared/types";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const BROWSER_FALLBACK_VIDEOS: PromotionVideo[] = [
  {
    id: "fallback-1",
    title: "Fallback Promo 1",
    src: "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
    mimeType: "video/mp4",
    active: true,
    order: 1,
  },
  {
    id: "fallback-2",
    title: "Fallback Promo 2",
    src: "https://samplelib.com/lib/preview/mp4/sample-15s.mp4",
    mimeType: "video/mp4",
    active: true,
    order: 2,
  },
];

export function usePromotionVideos() {
  const [videos, setVideos] = useState<PromotionVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusText, setStatusText] = useState("Downloading promotion videos...");

  const load = useCallback(async (forceRefresh = false) => {
    if (!window.electron?.promotion) {
      setVideos(BROWSER_FALLBACK_VIDEOS);
      setIsLoading(false);
      setStatusText("");
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

    const interval = window.setInterval(() => {
      void load(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [load]);

  return {
    videos,
    isLoading,
    statusText,
    refreshVideos: () => load(true),
  };
}
