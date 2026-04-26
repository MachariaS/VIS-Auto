import { useEffect, useState } from 'react';
import { formatCurrency, request } from '../../../../shared/helpers';
import useRequestTracking from '../hooks/useRequestTracking';
import TrackingMapCard from './TrackingMapCard';

const STATUS_STEPS = [
  { key: 'searching', label: 'Searching' },
  { key: 'provider_assigned', label: 'Provider assigned' },
  { key: 'in_progress', label: 'En route' },
  { key: 'completed', label: 'Complete' },
];

function StatusTimeline({ status }) {
  const activeIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="active-job-timeline">
      {STATUS_STEPS.map((step, index) => (
        <div
          key={step.key}
          className={`timeline-step ${index < activeIndex ? 'timeline-step--done' : ''} ${index === activeIndex ? 'timeline-step--active' : ''}`}
        >
          <div className="timeline-dot">{index < activeIndex ? '✓' : index + 1}</div>
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ActiveJobPanel({ requestItem, token, onDone }) {
  const { tracking, trackingLoading } = useRequestTracking({ token, selectedRequest: requestItem });
  const [cancelling, setCancelling] = useState(false);
  const [etaDisplay, setEtaDisplay] = useState(null);

  const currentStatus = tracking?.status ?? requestItem?.status;
  const canCancel = currentStatus === 'searching' || currentStatus === 'provider_assigned';

  useEffect(() => {
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      const timer = setTimeout(
        () => onDone(currentStatus === 'completed' ? requestItem : null),
        2500,
      );
      return () => clearTimeout(timer);
    }
  }, [currentStatus]);

  useEffect(() => {
    if (!tracking?.etaMinutes) return;
    setEtaDisplay(tracking.etaMinutes);
    if (tracking.etaMinutes <= 0) return;
    const interval = setInterval(() => setEtaDisplay((prev) => Math.max(0, (prev ?? 0) - 1)), 60000);
    return () => clearInterval(interval);
  }, [tracking?.etaMinutes]);

  async function handleCancel() {
    setCancelling(true);
    try {
      await request(`/roadside-requests/${requestItem.id}/status`, { status: 'cancelled' }, 'PATCH', token);
      onDone();
    } catch {
      setCancelling(false);
    }
  }

  if (!requestItem) return null;

  return (
    <div className="active-job-panel">
      <div className="active-job-header">
        <div>
          <p className="eyebrow">Active request</p>
          <h3>{requestItem.issueType}</h3>
        </div>
        <div className="active-job-price">
          <strong>{formatCurrency(requestItem.estimatedPriceKsh)}</strong>
          <span>Estimated</span>
        </div>
      </div>

      <StatusTimeline status={currentStatus} />

      {etaDisplay !== null && currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
        <div className="active-job-eta">
          <span className="eta-value">{etaDisplay}</span>
          <span className="eta-label">min ETA</span>
        </div>
      )}

      {tracking?.providerName && currentStatus !== 'searching' && (
        <div className="active-job-provider">
          <div>
            <p className="eyebrow">Provider</p>
            <strong>{tracking.providerName}</strong>
          </div>
        </div>
      )}

      {currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
        <TrackingMapCard requestItem={requestItem} tracking={tracking} />
      )}

      {currentStatus === 'completed' && (
        <div className="active-job-done">
          <span>✓</span>
          <p>Job complete — returning to history…</p>
        </div>
      )}

      {currentStatus === 'cancelled' && (
        <div className="active-job-done active-job-done--cancelled">
          <p>Request cancelled</p>
        </div>
      )}

      {canCancel && (
        <button className="ghost-button danger" type="button" onClick={handleCancel} disabled={cancelling}>
          {cancelling ? 'Cancelling...' : 'Cancel request'}
        </button>
      )}

      {trackingLoading && <p className="active-job-loading">Updating…</p>}
    </div>
  );
}
