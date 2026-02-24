import { useEffect, useMemo, useState } from "react";
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
  const playlist = useMemo(
    () => videos.filter((video) => Boolean(String(video.src || "").trim())),
    [videos],
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [playlist.length]);

  const currentVideo = playlist[currentIndex];

  const goToNext = () => {
    if (!playlist.length) return;
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  return (
    <section className="promotion-modal" onPointerDown={onGetStarted}>
      {currentVideo ? (
        <video
          key={currentVideo.id}
          className="promotion-video"
          autoPlay
          muted
          loop={playlist.length <= 1}
          playsInline
          onEnded={goToNext}
          onError={goToNext}
        >
          <source src={currentVideo.src} type={resolveMimeType(currentVideo)} />
        </video>
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
