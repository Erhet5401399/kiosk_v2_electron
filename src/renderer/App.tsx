// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

const CATEGORIES = [
  { name: "Бүгд", icon: "🗂️" },
  { name: "Кадастр", icon: "📐" },
  { name: "Бичиг баримт", icon: "📄" },
  { name: "Зөвшөөрөл", icon: "🛂" },
  { name: "Төлбөр", icon: "💰" },
];

const SERVICES = [
  {
    id: 1,
    category: "Кадастр",
    name: "Газрын кадастрын зураг",
    icon: "🗺️",
    desc: "Газрын байршил, хил хязгаар, талбайн хэмжээг албан ёсны кадастрын мэдээллийн сангаас шалгана. Иргэн, аж ахуйн нэгжийн эзэмшил болон өмчлөлийн газрын мэдээллийг тодорхой харуулсан кадастрын зургийг хэвлэж эсвэл цахимаар олгоно.",
    price: "₮5,000",
  },
  {
    id: 2,
    category: "Кадастр",
    name: "Газрын хил тогтоолт",
    icon: "📏",
    desc: "Газрын бодит хил хязгаарыг кадастрын мэдээлэлтэй тулган шалгаж, зөрчил байгаа эсэхийг тодорхойлно. Хөрш газруудтай давхцал үүссэн эсэх, талбайн хэмжээ нийцэж байгаа эсэхийг баталгаажуулахад тохиромжтой үйлчилгээ.",
    price: "₮10,000",
  },
  {
    id: 3,
    category: "Бичиг баримт",
    name: "Кадастрын лавлагаа",
    icon: "📑",
    desc: "Газрын кадастрын дугаар, зориулалт, талбай, байршлын талаарх албан ёсны лавлагаа гаргана. Худалдах, шилжүүлэх, банк санхүүгийн байгууллагад өгөхөд ашиглагдана.",
    price: "₮3,000",
  },
  {
    id: 4,
    category: "Зөвшөөрөл",
    name: "Газрын эзэмших эрхийн шалгалт",
    icon: "✅",
    desc: "Газрын эзэмших болон өмчлөх эрх хүчинтэй эсэх, хугацаа дууссан эсэх, барьцаалсан эсэх мэдээллийг шалгана. Эрсдэлээс урьдчилан сэргийлэхэд зориулагдсан үйлчилгээ.",
    price: "Үнэгүй",
  },
  {
    id: 5,
    category: "Төлбөр",
    name: "Газрын төлбөрийн мэдээлэл",
    icon: "💰",
    desc: "Газрын төлбөр, татварын үлдэгдэл болон төлөлтийн түүхийг шалгана. Өр төлбөр байгаа эсэхийг тодорхой харуулж, шаардлагатай бол төлбөрийн баримт хэвлэж өгнө.",
    price: "Үнэгүй",
  },
  {
    id: 6,
    category: "Бичиг баримт",
    name: "Кадастрын баримт хэвлэх",
    icon: "🖨️",
    desc: "Кадастрын зураг, лавлагаа болон холбогдох баримт бичгийг албан ёсны формат, чанартай хэвлэж өгнө. Байгууллага, нотариат, банканд шууд ашиглах боломжтой.",
    price: "₮2,000",
  },
];

const initialSnapshot = {
  state: "initializing",
  deviceId: undefined,
  retryCount: 0,
  uptime: 0,
  startedAt: 0,
};

function App() {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedCategory, setSelectedCategory] = useState("Бүгд");
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    if (window.electron) {
      window.electron.runtime.getSnapshot().then(setSnapshot);
      const unsubscribe = window.electron.runtime.onUpdate(setSnapshot);
      return unsubscribe;
    } else {
      setTimeout(
        () => setSnapshot((prev) => ({ ...prev, state: "booting" })),
        1000,
      );
      setTimeout(
        () =>
          setSnapshot((prev) => ({
            ...prev,
            state: "ready",
            deviceId: "KIOSK-001",
            uptime: 10,
            startedAt: Date.now(),
          })),
        3000,
      );
    }
  }, []);

  const filteredServices = useMemo(() => {
    if (selectedCategory === "Бүгд") return SERVICES;
    return SERVICES.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  const handlePrint = async () => {
    if (window.electron) {
      await window.electron.printer.print({
        content: `Service: ${selectedService?.name}\nDescription: ${selectedService?.desc}\nPrice: ${selectedService?.price}`,
      });
    } else {
      alert("Print command sent to mock printer!");
    }
    setSelectedService(null);
  };

  const stateLabel = {
    initializing: "Initializing system",
    booting: "Booting runtime",
    unregistered: "Device not registered",
    registering: "Registering device",
    authenticating: "Authenticating",
    loading_config: "Loading configuration",
    ready: "Kiosk ready",
    offline: "Offline mode",
    error: "Runtime error",
    shutting_down: "Shutting down",
  };

  if (snapshot.state !== "ready") {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <h2 style={{ marginTop: 24, fontWeight: 300, color: "white" }}>
          {stateLabel[snapshot.state]}
        </h2>
        <p style={{ color: "#aaa" }}>
          Device: {snapshot.deviceId ?? "Searching..."}
        </p>
      </div>
    );
  }

  return (
    <div className="screen">
      <section className="promo-container">
        <video
          className="promo-video"
          autoPlay
          muted
          loop
          playsInline
          // poster=""
        >
          <source
            src="https://www.pexels.com/download/video/3141208/"
            type="video/mp4"
          />
        </video>
        <div className="promo-overlay">
          <h1>Эрхэт киоск</h1>
          <p>Та доорх үйлчилгээнүүдээс сонгоно уу</p>
        </div>
      </section>

      <nav className="categories-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            className={`category-btn ${selectedCategory === cat.name ? "active" : ""}`}
            onClick={() => setSelectedCategory(cat.name)}
          >
            <span className="category-icon">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </nav>

      <main className="service-list">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="service-card"
            onClick={() => setSelectedService(service)}
          >
            <div className="card-header-flex">
              <div className="service-icon-box">{service.icon}</div>
              <div>
                <h3>{service.name}</h3>
                <p>{service.desc}</p>
              </div>
            </div>
            <div className="card-footer">
              <span className="price">{service.price}</span>
              <div className="select-btn">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </main>

      <AnimatePresence>
        {selectedService && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedService(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 150 || info.velocity.y > 500) {
                  setSelectedService(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-handle"></div>
              <div className="modal-body">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    className="service-icon-box"
                    style={{ width: "64px", height: "64px", fontSize: "2rem" }}
                  >
                    {selectedService.icon}
                  </div>
                  <h2>{selectedService.name}</h2>
                </div>
                <p>{selectedService.desc}</p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "rgba(0,0,0,0.03)",
                    padding: "24px",
                    borderRadius: "20px",
                  }}
                >
                  <span style={{ color: "var(--muted)", fontWeight: 600 }}>
                    Нийт төлбөр:
                  </span>
                  <span style={{ fontSize: "1.7rem", fontWeight: 900 }}>
                    {selectedService.price}
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handlePrint}>
                  Үйлчилгээ авах
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedService(null)}
                >
                  Болих
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="status-bar">
        <span>● {stateLabel[snapshot.state]}</span>
        <span>Киоск ID: {snapshot.deviceId.split("-")[0] ?? ""}</span>
        <span>Uptime: {snapshot.uptime}s</span>
      </footer>
    </div>
  );
}

export default App;
