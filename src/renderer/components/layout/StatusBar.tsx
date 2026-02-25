import type { UpdateStatus } from '../../../shared/types';

interface StatusBarProps {
  deviceState?: string;
  deviceId?: string;
  uptime?: number;
  updaterStatus: UpdateStatus;
  onUpdateCheck: () => Promise<void>;
}

const UPDATER_LABELS: Record<UpdateStatus['state'], string> = {
  idle: 'Idle',
  checking: 'Checking',
  available: 'Available',
  downloading: 'Downloading',
  downloaded: 'Downloaded',
  installing: 'Installing',
  up_to_date: 'Up to date',
  error: 'Error',
};

function formatUptime(totalSeconds?: number): string {
  if (!totalSeconds || totalSeconds < 0) return '--';
  const seconds = Math.floor(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${secs}s`;
}

export function StatusBar({
  deviceState,
  deviceId,
  uptime,
  updaterStatus,
  onUpdateCheck,
}: StatusBarProps) {
  const isBusy =
    updaterStatus.state === 'checking' ||
    updaterStatus.state === 'downloading' ||
    updaterStatus.state === 'installing';
  const percentText =
    typeof updaterStatus.percent === 'number'
      ? `${Math.round(updaterStatus.percent)}%`
      : '-';
  const updaterStateClass = `updater-state updater-state-${updaterStatus.state}`;

  return (
    <footer className="status-bar">
      <div className="status-meta">
        <span className="status-item">
          <span className="status-label">State</span>
          <strong className="status-value">{deviceState || 'Unknown'}</strong>
        </span>
        <span className="status-item">
          <span className="status-label">Kiosk ID</span>
          <strong className="status-value status-id">{deviceId || 'Unknown'}</strong>
        </span>
        <span className="status-item">
          <span className="status-label">Uptime</span>
          <strong className="status-value">{formatUptime(uptime)}</strong>
        </span>
      </div>

      <div className="updater-panel">
        <span className={updaterStateClass}>
          {UPDATER_LABELS[updaterStatus.state]} {percentText !== '-' ? `(${percentText})` : ''}
        </span>
        <span className="updater-version">
          v{updaterStatus.currentVersion}
          {updaterStatus.availableVersion ? ` -> v${updaterStatus.availableVersion}` : ''}
        </span>
        {updaterStatus.error && (
          <span className="updater-error">{updaterStatus.error}</span>
        )}
        {updaterStatus.state === 'downloaded' && (
          <span className="updater-note">Auto install queued</span>
        )}

        <div className="updater-actions">
          <button
            className="updater-btn"
            type="button"
            disabled={isBusy}
            onClick={() => void onUpdateCheck()}
          >
            Check
          </button>
        </div>
      </div>
    </footer>
  );
}
