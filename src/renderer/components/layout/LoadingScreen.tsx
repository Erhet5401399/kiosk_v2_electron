import { APP_NAME, STATE_LABELS } from '../../constants';
import { Logo } from '../common';

interface LoadingScreenProps {
  state: string;
  deviceId?: string;
}

export function LoadingScreen({ state, deviceId }: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 }}>
        <Logo />
        <h1 style={{ marginTop: 16, color: '#aaa' }}>{APP_NAME}</h1>
      </div>
      <div className="spinner" />
      <h2 style={{ marginTop: 40, marginBottom: 10, fontWeight: 600, color: "white", textTransform: "uppercase" }}>
        {STATE_LABELS[state] || state}
      </h2>
      <p style={{ color: '#aaa', fontSize: '1.2rem', margin: 0 }}>Device: {deviceId ?? 'Searching...'}</p>
    </div>
  );
}
