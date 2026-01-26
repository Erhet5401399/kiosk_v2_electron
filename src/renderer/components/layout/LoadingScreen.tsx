import { STATE_LABELS } from '../../constants';

interface LoadingScreenProps {
  state: string;
  deviceId?: string;
}

export function LoadingScreen({ state, deviceId }: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <h2 style={{ marginTop: 24, fontWeight: 300, color: 'white' }}>
        {STATE_LABELS[state] || state}
      </h2>
      <p style={{ color: '#aaa' }}>Device: {deviceId ?? 'Searching...'}</p>
    </div>
  );
}
