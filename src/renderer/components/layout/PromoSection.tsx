interface PromoSectionProps {
  logoSrc?: string;
  title?: string;
  subtitle?: string;
  videoSrc?: string;
}

export function PromoSection({
  logoSrc = '/assets/logo.png',
  title = 'Эрхэт киоск',
  subtitle = 'Та үйлчилгээний төрлөө сонгоно уу!',
  videoSrc = 'https://www.pexels.com/download/video/3141208/',
}: PromoSectionProps) {
  return (
    <section className="promo-container">
      <video className="promo-video" autoPlay muted loop playsInline>
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div className="promo-overlay">
        <div className="promo-overlay-title">
          <img src={logoSrc} alt="Logo" />
          <h1>{title}</h1>
        </div>
        <p>{subtitle}</p>
      </div>
    </section>
  );
}
