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

  return (
    <footer className="status-bar">
      <span>Kiosk state: {deviceState}</span>
      <span>Kiosk ID: {deviceId || 'Unknown'}</span>
      <span>Uptime: {uptime ? `${uptime}s` : '-'}</span>

      <div className="updater-panel">
        <span>
          Update: {UPDATER_LABELS[updaterStatus.state]} ({percentText})
          {updaterStatus.mock ? ' [mock]' : ''}
        </span>
        <span>
          v{updaterStatus.currentVersion}
          {updaterStatus.availableVersion
            ? ` -> v${updaterStatus.availableVersion}`
            : ''}
        </span>
        {updaterStatus.error && (
          <span className="updater-error">{updaterStatus.error}</span>
        )}
        {updaterStatus.state === 'downloaded' && (
          <span>Auto install queued (no manual action)</span>
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
