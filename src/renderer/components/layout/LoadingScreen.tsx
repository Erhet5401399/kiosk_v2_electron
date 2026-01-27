import { APP_NAME, STATE_LABELS } from '../../constants';

interface LoadingScreenProps {
  state: string;
  deviceId?: string;
}

export function LoadingScreen({ state, deviceId }: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      <h1 style={{ marginTop: 16, color: '#aaa' }}>{APP_NAME}</h1>
      <div className="spinner" />
      <h2 style={{ marginTop: 24, fontWeight: 600, color: 'white', }}>
        {STATE_LABELS[state] || state}
      </h2>
      <p style={{ color: '#aaa', fontSize: '1.2rem' }}>Device: {deviceId ?? 'Searching...'}</p>
    </div>
  );
}
