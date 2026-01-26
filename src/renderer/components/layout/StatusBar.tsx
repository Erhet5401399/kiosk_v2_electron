interface StatusBarProps {
  deviceId?: string;
  uptime?: number;
}

export function StatusBar({ deviceId, uptime }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>Device: {deviceId || 'Unknown'}</span>
      <span>Uptime: {uptime ? `${uptime}s` : '-'}</span>
    </footer>
  );
}
