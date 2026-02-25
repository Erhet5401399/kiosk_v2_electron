import type { UpdateStatus } from '../../../shared/types';

interface StatusBarProps {
  deviceState?: string;
  deviceId?: string;
  printerLabel?: string;
  printerConnected?: boolean;
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

export function StatusBar({
  deviceState,
  deviceId,
  printerLabel,
  printerConnected,
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
          <span className="status-label">Printer</span>
          <strong className="status-value">
            {printerConnected ? `Connected: ${printerLabel || "Unknown"}` : "Disconnected"}
          </strong>
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
