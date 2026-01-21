import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";

type AppState = "loading" | "register" | "ready" | "error";

function App() {
  const [state, setState] = useState<AppState>("loading");
  const [deviceId, setDeviceId] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [printResult, setPrintResult] = useState<string>("");

  useEffect(() => {
    async function boot() {
      try {
        const status = await window.electron.getDeviceStatus();
        setDeviceId(status.deviceId);

        if (!status.registered) {
          setState("register");
          return;
        }

        await window.electron.authenticate();
        setState("ready");
      } catch (err) {
        console.error(err);
        setAuthError("Failed to initialize device");
        setState("error");
      }
    }

    boot();
  }, []);

  const handlePrint = async () => {
    try {
      const result = await window.electron.print("Test print from kiosk");
      setPrintResult(result);
    } catch {
      setPrintResult("Print failed");
    }
  };

  if (state === "loading") {
    return (
      <div className="screen center">
        <h2>Starting kiosk…</h2>
      </div>
    );
  }

  if (state === "register") {
    return (
      <div className="screen center">
        <h1>Device Registration</h1>
        <p>This device is not registered.</p>

        <div className="device-box">
          <strong>Device ID</strong>
          <pre>{deviceId}</pre>
        </div>

        <p>
          Please register this device in the admin panel.
          <br />
          The kiosk will activate automatically.
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="screen center error">
        <h2>Startup Error</h2>
        <p>{authError}</p>
      </div>
    );
  }

  return (
    <div className="screen kiosk">
      <header className="header">
        <img src={reactLogo} className="logo" />
        <div className="device-info">
          Device: {deviceId}
        </div>
      </header>

      <main className="content">
        <h1>Kiosk Ready</h1>

        <button className="primary" onClick={handlePrint}>
          Print Test Document
        </button>

        {printResult && <p className="result">{printResult}</p>}
      </main>
    </div>
  );
}

export default App;
