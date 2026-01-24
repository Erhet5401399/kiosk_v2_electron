import { useEffect, useMemo, useState } from "react";
import "./App.css";
import type { RuntimeSnapshot, RuntimeState } from "../shared/types";

const initialSnapshot: RuntimeSnapshot = {
  state: "initializing",
  deviceId: undefined,
  retryCount: 0,
  uptime: 0,
  startedAt: 0,
};

function App() {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>(initialSnapshot);

  useEffect(() => {
    window.electron.runtime.getSnapshot().then(setSnapshot);

    const unsubscribe = window.electron.runtime.onUpdate(setSnapshot);
    return unsubscribe;
  }, []);

  const startedAtText = useMemo(() => {
    if (!snapshot.startedAt) return "-";
    return new Date(snapshot.startedAt).toLocaleString();
  }, [snapshot.startedAt]);

  const stateLabel: Record<RuntimeState, string> = {
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

  const handlePrint = async () => {
    await window.electron.printer.print({
      content: "Test Print Document",
    });
  };

  return (
    <div className={`screen state-${snapshot.state}`}>
      {/* GLOBAL STATUS BAR */}
      <header className="status-bar">
        <span className="state">{stateLabel[snapshot.state]}</span>
        <span>Device: {snapshot.deviceId ?? "-"}</span>
        <span>Uptime: {snapshot.uptime}s</span>
      </header>

      {/* INITIAL / BOOT */}
      {(snapshot.state === "initializing" || snapshot.state === "booting") && (
        <Center title={stateLabel[snapshot.state]} spinner />
      )}

      {/* REGISTRATION FLOW */}
      {(snapshot.state === "unregistered" ||
        snapshot.state === "registering") && (
        <Center title="Device Registration">
          <div className="box">{snapshot.deviceId}</div>
          <div>Retries: {snapshot.retryCount}</div>
          <small>Waiting for backend approval</small>
        </Center>
      )}

      {/* AUTH / CONFIG */}
      {(snapshot.state === "authenticating" ||
        snapshot.state === "loading_config") && (
        <Center title={stateLabel[snapshot.state]} spinner />
      )}

      {/* READY */}
      {snapshot.state === "ready" && (
        <main className="kiosk">
          <section className="info">
            <div>Started at: {startedAtText}</div>
            <div>Uptime: {snapshot.uptime}s</div>
          </section>

          <section className="actions">
            <button onClick={handlePrint}>Print Test</button>
          </section>
        </main>
      )}

      {/* OFFLINE */}
      {snapshot.state === "offline" && (
        <Center title="Offline">
          <p>Network unavailable</p>
          <p>Retries: {snapshot.retryCount}</p>
        </Center>
      )}

      {/* ERROR */}
      {snapshot.state === "error" && (
        <Center title="Fatal Error" error>
          <p>{snapshot.errorMessage || snapshot.error}</p>
          <p>Retries: {snapshot.retryCount}</p>
        </Center>
      )}

      {/* SHUTDOWN */}
      {snapshot.state === "shutting_down" && (
        <Center title="Shutting down" spinner />
      )}
    </div>
  );
}

function Center({
  title,
  spinner,
  error,
  children,
}: {
  title: string;
  spinner?: boolean;
  error?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`center ${error ? "error" : ""}`}>
      {spinner && <div className="spinner" />}
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default App;
