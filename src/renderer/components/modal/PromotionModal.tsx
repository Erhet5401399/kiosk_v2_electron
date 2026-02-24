import { useEffect, useMemo, useRef, useState } from "react";
import type { PromotionVideo } from "../../../shared/types";

interface PromotionModalProps {
  videos: PromotionVideo[];
  isLoading?: boolean;
  statusText?: string;
  onGetStarted: () => void;
}

function resolveMimeType(video: PromotionVideo): string {
  if (video.mimeType) return video.mimeType;
  return "video/mp4";
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

  const goToNext = () => {
    if (!playlist.length) return;
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  return (
    <section className="promotion-modal" onPointerDown={onGetStarted}>
      {currentVideo ? (
        <video
          ref={videoRef}
          key={`${currentVideo.id}-${currentVideo.src}-${currentIndex}`}
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
