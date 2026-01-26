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
  const [registerNumber, setRegisterNumber] = useState("");
  const [registerPrefix, setRegisterPrefix] = useState("");
  const [registerSuffix, setRegisterSuffix] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardTarget, setKeyboardTarget] = useState("prefix"); // prefix or suffix

  const MONGOLIAN_KEYBOARD = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["Ф", "Ц", "У", "Ж", "Э", "Н", "Г", "Ш", "Ү", "З", "К", "Ъ"],
    ["Й", "Ы", "Б", "Ө", "А", "Х", "Р", "О", "Л", "Д", "П"],
    ["Я", "Ч", "Ё", "С", "М", "И", "Т", "Ь", "В", "Ю"],
  ];

  const handleKeyClick = (key) => {
    if (keyboardTarget === "prefix") {
      if (registerPrefix.length < 2 && isNaN(key)) {
        setRegisterPrefix((prev) => prev + key);
        if (registerPrefix.length === 1) setKeyboardTarget("suffix");
      }
    } else {
      if (registerSuffix.length < 8 && !isNaN(key)) {
        setRegisterSuffix((prev) => prev + key);
      }
    }
  };

  const handleBackspace = () => {
    if (keyboardTarget === "suffix" && registerSuffix.length > 0) {
      setRegisterSuffix((prev) => prev.slice(0, -1));
    } else if (keyboardTarget === "suffix" && registerSuffix.length === 0) {
      setKeyboardTarget("prefix");
      setRegisterPrefix((prev) => prev.slice(0, -1));
    } else if (keyboardTarget === "prefix") {
      setRegisterPrefix((prev) => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    setRegisterNumber(registerPrefix + registerSuffix);
  }, [registerPrefix, registerSuffix]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentStep, setPaymentStep] = useState("info"); // info, payment, success

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setPaymentStep("info");
    setPaymentMethod(null);
    setRegisterNumber("");
  };

  const handlePrint = async () => {
    if (window.electron) {
      await window.electron.printer.print({
        content: `Service: ${selectedService?.name}\nRegister: ${registerNumber}\nPrice: ${selectedService?.price}`,
      });
    } else {
      alert("Баримт хэвлэх команд илгээгдлээ!");
    }
    setSelectedService(null);
  };

  const startPayment = () => {
    if (!registerNumber || registerNumber.length < 7) {
      alert("Регистрийн дугаараа зөв оруулна уу.");
      return;
    }
    setPaymentStep("payment");
  };

  const simulatePayment = (method) => {
    setPaymentMethod(method);
    // Simulate processing
    setTimeout(() => {
      setPaymentStep("success");
    }, 2000);
  };

  const filteredServices = useMemo(() => {
    if (selectedCategory === "Бүгд") return SERVICES;
    return SERVICES.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

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
          <div className="promo-overlay-title">
            <img src="./assets/logo.png" alt="Logo" />
            <h1>Эрхэт киоск</h1>
          </div>
          <p>Та үйлчилгээний төрлөө сонгоно уу!</p>
        </div>
      </section>

      <div className="content sidebar-layout">
        <aside className="sidebar">
          <div className="sidebar-pill-container">
            <motion.div
              className="sidebar-active-pill"
              animate={{
                y:
                  CATEGORIES.findIndex((c) => c.name === selectedCategory) * 72,
              }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
            />
            <nav className="categories-list">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  className={`category-btn-sidebar ${selectedCategory === cat.name ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span className="category-name">{cat.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="service-list">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="service-card"
              onClick={() => handleServiceSelect(service)}
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
                  <span>Үйлчилгээ авах</span>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M5 12H19M13 6L19 12L13 18"
                      stroke="currentColor"
                      stroke-width="1"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </main>
      </div>

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
              className="modal-content full-height"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "tween",
                duration: 0.4,
                ease: [0.32, 0.72, 0, 1],
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-fixed">
                <div className="modal-handle"></div>
                <button
                  className="modal-close-icon"
                  onClick={() => setSelectedService(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-scroll-body">
                {paymentStep === "info" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="service-header-modal">
                      <div className="service-icon-box large">
                        {selectedService.icon}
                      </div>
                      <div>
                        <h1>{selectedService.name}</h1>
                      </div>
                    </div>

                    <div>
                      <p>{selectedService.desc}</p>
                    </div>

                    <div className="input-section">
                      <label>Иргэний регистрийн дугаар</label>
                      <div className="segmented-input-container">
                        <div
                          className={`segment-box prefix ${keyboardTarget === "prefix" && showKeyboard ? "active" : ""}`}
                          onClick={() => {
                            setShowKeyboard(true);
                            setKeyboardTarget("prefix");
                          }}
                        >
                          <span className="segment-label">Үсэг</span>
                          <div className="segment-value">
                            {registerPrefix || (
                              <span className="placeholder">АА</span>
                            )}
                            {keyboardTarget === "prefix" && showKeyboard && (
                              <div className="cursor"></div>
                            )}
                          </div>
                        </div>
                        <div className="segment-dash">-</div>
                        <div
                          className={`segment-box suffix ${keyboardTarget === "suffix" && showKeyboard ? "active" : ""}`}
                          onClick={() => {
                            setShowKeyboard(true);
                            setKeyboardTarget("suffix");
                          }}
                        >
                          <span className="segment-label">Тоо</span>
                          <div className="segment-value">
                            {registerSuffix || (
                              <span className="placeholder">12345678</span>
                            )}
                            {keyboardTarget === "suffix" && showKeyboard && (
                              <div className="cursor"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {showKeyboard && (
                      <motion.div
                        className="virtual-keyboard"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {MONGOLIAN_KEYBOARD.map((row, i) => (
                          <div key={i} className="keyboard-row">
                            {row.map((key) => (
                              <button
                                key={key}
                                className="key"
                                onClick={() => handleKeyClick(key)}
                              >
                                {key}
                              </button>
                            ))}
                            {i === 3 && (
                              <button
                                className="key backspace"
                                onClick={handleBackspace}
                              >
                                Арилгах
                              </button>
                            )}
                          </div>
                        ))}
                        <div className="keyboard-footer">
                          <button
                            className="keyboard-done"
                            onClick={() => setShowKeyboard(false)}
                          >
                            Болсон
                          </button>
                        </div>
                      </motion.div>
                    )}

                    <div className="price-summary-box">
                      <span className="label">Нийт төлбөр:</span>
                      <span className="value">{selectedService.price}</span>
                    </div>

                    <div className="modal-footer">
                      <button
                        className="btn btn-primary"
                        onClick={startPayment}
                      >
                        Төлбөр төлөх
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSelectedService(null)}
                      >
                        Болих
                      </button>
                    </div>
                  </motion.div>
                )}

                {paymentStep === "payment" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="payment-selection"
                  >
                    <h2>Төлбөрийн хэлбэр сонгох</h2>
                    <p>Та төлбөрөө дараах аргуудаас сонгон төлнө үү</p>

                    <div className="payment-grid">
                      <button
                        className={`payment-option ${paymentMethod === "qrcode" ? "loading" : ""}`}
                        onClick={() => simulatePayment("qrcode")}
                        disabled={!!paymentMethod}
                      >
                        <div className="payment-icon">📱</div>
                        <div className="payment-info">
                          <h3>QR Код</h3>
                          <span>SocialPay, QPay, Банкны апп</span>
                        </div>
                        {paymentMethod === "qrcode" && (
                          <div className="mini-spinner"></div>
                        )}
                      </button>

                      <button
                        className={`payment-option ${paymentMethod === "pos" ? "loading" : ""}`}
                        onClick={() => simulatePayment("pos")}
                        disabled={!!paymentMethod}
                      >
                        <div className="payment-icon">💳</div>
                        <div className="payment-info">
                          <h3>POS Машин</h3>
                          <span>Бүх төрлийн банкны карт</span>
                        </div>
                        {paymentMethod === "pos" && (
                          <div className="mini-spinner"></div>
                        )}
                      </button>
                    </div>

                    <div className="modal-footer">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setPaymentStep("info")}
                        disabled={!!paymentMethod}
                      >
                        Буцах
                      </button>
                    </div>
                  </motion.div>
                )}

                {paymentStep === "success" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="success-view"
                  >
                    <div className="confetti-container">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className="confetti"
                          style={{
                            left: `${Math.random() * 100}%`,
                            background: [
                              "#007aff",
                              "#5856d6",
                              "#107f32",
                              "#ff9500",
                            ][i % 4],
                            animationDelay: `${Math.random() * 3}s`,
                            width: `${Math.random() * 8 + 4}px`,
                            height: `${Math.random() * 8 + 4}px`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="success-header">
                      <div className="success-icon">✅</div>
                      <h2>Төлбөр амжилттай</h2>
                      <p>Таны баримт бэлэн боллоо</p>
                    </div>

                    <div className="pdf-preview-container">
                      <div className="pdf-mock-page">
                        <div className="pdf-header">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Soyombo_symbol.svg/1200px-Soyombo_symbol.svg.png"
                            alt="Soyombo"
                            className="pdf-logo"
                          />
                          <div>
                            <h4>ГАЗРЫН ХАРИЛЦАА, ГЕОДЕЗИ, ЗУРАГ ЗҮЙН ГАЗАР</h4>
                            <p>Албан ёсны баримт бичиг</p>
                          </div>
                        </div>
                        <hr />
                        <div className="pdf-content">
                          <div className="pdf-row">
                            <span>Үйлчилгээ:</span>
                            <strong>{selectedService.name}</strong>
                          </div>
                          <div className="pdf-row">
                            <span>Регистрийн дугаар:</span>
                            <strong>{registerNumber}</strong>
                          </div>
                          <div className="pdf-row">
                            <span>Огноо:</span>
                            <strong>{new Date().toLocaleDateString()}</strong>
                          </div>
                          <div className="pdf-row">
                            <span>Төлөв:</span>
                            <strong style={{ color: "green" }}>
                              Баталгаажсан
                            </strong>
                          </div>
                          <div className="pdf-qr-placeholder">
                            <div className="mock-qr"></div>
                            <p>Баримтын дугаар: #88219472</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button className="btn btn-primary" onClick={handlePrint}>
                        Хэвлэх
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSelectedService(null)}
                      >
                        Дуусгах
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="status-bar">
        <span>● {stateLabel[snapshot.state]}</span>
        <span>Киоск ID: {snapshot.deviceId?.split("-")[0] ?? ""}</span>
        <span>Uptime: {snapshot.uptime}s</span>
      </footer>
    </div>
  );
}

export default App;
