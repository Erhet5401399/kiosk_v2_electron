import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PromotionVideo } from "../../../shared/types";

interface PromotionModalProps {
  videos: PromotionVideo[];
  isLoading?: boolean;
  statusText?: string;
  onGetStarted: () => void;
}

export function PromotionModal({
  videos,
  isLoading = false,
  statusText = "",
  onGetStarted,
}: PromotionModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isSwitching = useRef(false);
  const playlist = useMemo(
    () => videos.filter((video) => Boolean(String(video.src || "").trim())),
    [videos],
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex((prev) => {
      if (!playlist.length) return 0;
      return prev >= playlist.length ? 0 : prev;
    });
  }, [playlist]);

  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (!video) return;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  const currentVideo = playlist[currentIndex];

  const goToNext = useCallback(() => {
    if (!playlist.length) return;
    if (isSwitching.current) return;
    isSwitching.current = true;
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
    setTimeout(() => {
    isSwitching.current = false;
  }, 100);
  }, [playlist.length]);

  return (
    <section className="promotion-modal" onPointerDown={onGetStarted}>
      {currentVideo ? (
        <video
          ref={videoRef}
          className="promotion-video"
          src={currentVideo.src}
          autoPlay
          muted
          loop={playlist.length <= 1}
          preload="auto"
          playsInline
          onEnded={goToNext}
          onError={goToNext}
        />
      ) : (
        <div className="promotion-video promotion-fallback" />
      )}

      <div className="promotion-overlay">
        <div className="promotion-content">
          {(isLoading || statusText) && (
            <p className="promotion-status">{statusText || "Loading..."}</p>
          )}
          <button
            type="button"
            className="promotion-start-btn"
            onClick={(event) => {
              event.stopPropagation();
              onGetStarted();
            }}
          >
            Үйлчилгээ авах
          </button>
        </div>
      </div>
    </section>
  );
}
