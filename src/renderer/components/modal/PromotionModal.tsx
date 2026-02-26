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
    setCurrentIndex((prev) => {
      if (!playlist.length) return 0;
      return (prev + 1) % playlist.length;
    });
  }, [playlist.length]);

  const handleVideoEnded = useCallback(() => {
    if (!playlist.length) return;
    goToNext();
  }, [goToNext, playlist.length]);

  const handleDismissPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      window.setTimeout(() => {
        onGetStarted();
      }, 0);
    },
    [onGetStarted],
  );

  const swallowClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <section
      className="promotion-modal"
      onPointerDown={handleDismissPointerDown}
      onClick={swallowClick}
    >
      {currentVideo ? (
        <video
          key={currentVideo.id || currentVideo.src}
          ref={videoRef}
          className="promotion-video"
          src={currentVideo.src}
          autoPlay
          muted
          loop={playlist.length === 1}
          preload="metadata"
          playsInline
          onEnded={handleVideoEnded}
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
            onPointerDown={handleDismissPointerDown}
            onClick={swallowClick}
          >
            Үйлчилгээ авах
          </button>
        </div>
      </div>
    </section>
  );
}
