import { useEffect, useState } from "react";
import "./App.css";

type RuntimeState = "loading" | "unregistered" | "authenticating" | "ready" | "error";

interface Snapshot {
  state: RuntimeState;
  deviceId: string;
  error?: string;
}

function App() {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    state: "loading",
    deviceId: "",
  });

  useEffect(() => {
    window.electron.getRuntimeSnapshot().then(setSnapshot);
    const unsubscribe = window.electron.onRuntimeState(setSnapshot);
    return unsubscribe;
  }, []);

  return (
    <div className={`screen ${snapshot.state}`}>
      {snapshot.state === "loading" && (
        <div className="center">
          <div className="spinner" />
          <h2>Starting Kiosk…</h2>
        </div>
      )}

      {snapshot.state === "unregistered" && (
        <div className="center register">
          <h1>Device Registration</h1>
          <p>This device is not registered.</p>
          <div className="device-box">{snapshot.deviceId}</div>
          <p className="subtext">Kiosk will activate automatically once registered.</p>
        </div>
      )}

      {snapshot.state === "authenticating" && (
        <div className="center">
          <div className="spinner" />
          <h2>Activating device…</h2>
        </div>
      )}

      {snapshot.state === "ready" && (
        <div className="kiosk-ready">
          <header className="header">
            <h1>Kiosk Ready</h1>
            <div className="device-info">Device: {snapshot.deviceId}</div>
          </header>
          <main className="content">
            <button className="primary" onClick={() => alert("Print test!")}>
              Print Test Document
            </button>
          </main>
        </div>
      )}

      {snapshot.state === "error" && (
        <div className="center error">
          <h2>Startup Error</h2>
          <p>{snapshot.error || "Unknown error occurred"}</p>
        </div>
      )}
    </div>
  );
}

export default App;
