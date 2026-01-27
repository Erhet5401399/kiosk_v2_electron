import { APP_NAME } from "../../constants";
import { Logo } from "../common";

interface PromoSectionProps {
  logoSrc?: string;
  title?: string;
  subtitle?: string;
  videoSrc?: string;
}

export function PromoSection({
  title = APP_NAME,
  subtitle = "Та үйлчилгээний төрлөө сонгоно уу!",
  videoSrc = "https://www.pexels.com/download/video/3141208/",
}: PromoSectionProps) {
  return (
    <>
      <section className="promo-container">
        <video className="promo-video" autoPlay muted loop playsInline>
          <source src={videoSrc} type="video/mp4" />
        </video>
      </section>

      <header className="main-header">
        <div className="header-content">
          <div className="header-brand">
            <Logo/>
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
