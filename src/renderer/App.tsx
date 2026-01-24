import { useEffect, useState } from "react";
import "./App.css";
import type { RuntimeSnapshot } from "../shared/types";

function App() {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>({
    state: "initializing",
    deviceId: "",
    retryCount: 0,
    uptime: 0,
    startedAt: 0,
  });

  useEffect(() => {
    window.electron.runtime.getSnapshot().then(setSnapshot);
    const unsubscribe = window.electron.runtime.onUpdate((snap) => {
      setSnapshot(snap);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log(snapshot, "snapshot changed");
  }, [snapshot]);

  const handlePrint = async () => {
    try {
      await window.electron.printer.print({ content: "Test Print Document" });
      alert("Print job sent");
    } catch (err) {
      console.error("Printing failed", err);
      alert("Failed to print document");
    }
  };

  return (
    <div className={`screen ${snapshot.state}`}>
      {snapshot.state === "initializing" && (
        <div className="center">
          <div className="spinner" />
          <h2>Starting Kiosk…</h2>
        </div>
      )}

      {(snapshot.state === "unregistered" ||
        snapshot.state === "registering") && (
        <div className="center register">
          <h1>Device Registration</h1>
          <p>This device is not registered.</p>
          <div className="device-box">{snapshot.deviceId}</div>
          {snapshot.retryCount !== undefined && (
            <p>Retries: {snapshot.retryCount}</p>
          )}
          <p className="subtext">
            Kiosk will activate automatically once registered.
          </p>
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
            {snapshot.uptime !== undefined && (
              <div>Uptime: {snapshot.uptime}s</div>
            )}
          </header>
          <main className="content">
            <button className="primary" onClick={handlePrint}>
              Print Test Document
            </button>
          </main>
        </div>
      )}

      {snapshot.state === "error" && (
        <div className="center error">
          <h2>Startup Error</h2>
          <p>{snapshot.errorMessage || "Unknown error occurred"}</p>
        </div>
      )}
    </div>
  );
}

export default App;
