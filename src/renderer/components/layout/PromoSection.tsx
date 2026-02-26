import { useEffect, useRef } from "react";
import { APP_NAME } from "../../constants";
import { Logo } from "../common";

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
  videoSrc = "https://www.pexels.com/download/video/3141208/",
  paused = false,
}: PromoSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (paused) {
      video.pause();
      return;
    }

    void video.play().catch(() => {});
  }, [paused]);

  return (
    <>
      <section className="promo-container">
        <video ref={videoRef} className="promo-video" autoPlay muted loop playsInline>
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
