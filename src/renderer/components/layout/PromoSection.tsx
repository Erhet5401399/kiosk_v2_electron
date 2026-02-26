import { useEffect, useRef } from "react";
import { APP_NAME } from "../../constants";
import { Logo } from "../common";
import homePromoVideo from "../../assets/videos/home-promo.mp4";

interface PromoSectionProps {
  logoSrc?: string;
  title?: string;
  subtitle?: string;
  videoSrc?: string;
  paused?: boolean;
}

export function PromoSection({
  title = APP_NAME,
  subtitle = "Та үйлчилгээний төрлөө сонгоно уу.",
  videoSrc = homePromoVideo,
  paused = false,
}: PromoSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncPlayback = () => {
      if (paused || document.hidden) {
        video.pause();
        return;
      }

      void video.play().catch(() => {});
    };

    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);

    return () => {
      document.removeEventListener("visibilitychange", syncPlayback);
    };
  }, [paused]);

  return (
    <>
      <section className="promo-container">
        <video
          ref={videoRef}
          className="promo-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </section>

      <header className="main-header">
        <div className="header-content">
          <div className="header-brand">
            <Logo />
            <div className="header-text">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
