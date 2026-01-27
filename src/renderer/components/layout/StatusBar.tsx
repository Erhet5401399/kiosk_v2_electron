interface StatusBarProps {
  deviceState?: string;
  deviceId?: string;
  uptime?: number;
}

export function StatusBar({ deviceState, deviceId, uptime }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>Киоск төлөв: {deviceState}</span>
      <span>Киоск ID: {deviceId || 'Unknown'}</span>
      <span>Uptime: {uptime ? `${uptime}s` : '-'}</span>
    </footer>
  );
}
