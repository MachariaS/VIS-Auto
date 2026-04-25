import { useEffect, useRef, useState } from 'react';
import { formatCurrency, request } from '../../../shared/helpers';

const STATUS_LABELS = {
  searching: 'New request',
  provider_assigned: 'Accepted — going to customer',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const NEXT_STATUS = {
  searching: null,
  provider_assigned: 'in_progress',
  in_progress: 'completed',
};

const NEXT_LABEL = {
  provider_assigned: 'Start job',
  in_progress: 'Mark complete',
};

export default function ProviderJobCard({ job, token, onStatusChange }) {
  const [updating, setUpdating] = useState(false);
  const watchIdRef = useRef(null);
  const broadcastIntervalRef = useRef(null);
  const isActive = job.status === 'provider_assigned' || job.status === 'in_progress';

  useEffect(() => {
    if (!isActive) return stopGps;

    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        broadcastLocation(position.coords.latitude, position.coords.longitude);
      },
      null,
      { enableHighAccuracy: true, timeout: 15000 },
    );

    broadcastIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        broadcastLocation(pos.coords.latitude, pos.coords.longitude);
      });
    }, 15000);

    return stopGps;
  }, [isActive, job.id, token]);

  function stopGps() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (broadcastIntervalRef.current !== null) {
      clearInterval(broadcastIntervalRef.current);
      broadcastIntervalRef.current = null;
    }
  }

  async function broadcastLocation(latitude, longitude) {
    try {
      await request(
        `/roadside-requests/${job.id}/provider-location`,
        { latitude, longitude },
        'PATCH',
        token,
      );
    } catch {
      // location update failures are non-fatal
    }
  }

  async function handleAccept() {
    setUpdating(true);
    try {
      await request(`/roadside-requests/${job.id}/status`, { status: 'provider_assigned' }, 'PATCH', token);
      await onStatusChange();
    } catch {
      // fall through
    } finally {
      setUpdating(false);
    }
  }

  async function handleDecline() {
    setUpdating(true);
    try {
      await request(`/roadside-requests/${job.id}/status`, { status: 'cancelled' }, 'PATCH', token);
      await onStatusChange();
    } catch {
      // fall through
    } finally {
      setUpdating(false);
    }
  }

  async function handleNext() {
    const nextStatus = NEXT_STATUS[job.status];
    if (!nextStatus) return;
    setUpdating(true);
    try {
      await request(`/roadside-requests/${job.id}/status`, { status: nextStatus }, 'PATCH', token);
      await onStatusChange();
    } catch {
      // fall through
    } finally {
      setUpdating(false);
    }
  }

  return (
    <article className="provider-job-card">
      <div className="provider-job-card-head">
        <div>
          <span className={`job-status-badge job-status-badge--${job.status}`}>
            {STATUS_LABELS[job.status] ?? job.status}
          </span>
          <h4>{job.issueType}</h4>
        </div>
        <strong className="job-price">{formatCurrency(job.estimatedPriceKsh)}</strong>
      </div>

      <div className="provider-job-card-meta">
        {job.address && (
          <span className="job-meta-chip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
            {job.address}{job.landmark ? ` — ${job.landmark}` : ''}
          </span>
        )}
        {job.distanceKm && (
          <span className="job-meta-chip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12h18M3 6l9-4 9 4M3 18l9 4 9-4"/></svg>
            {Number(job.distanceKm).toFixed(1)} km
          </span>
        )}
        {job.customer?.name && (
          <span className="job-meta-chip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>
            {job.customer.name}
          </span>
        )}
      </div>

      <div className="provider-job-card-actions">
        {job.status === 'searching' && (
          <>
            <button type="button" className="primary-cta" onClick={handleAccept} disabled={updating}>
              {updating ? 'Accepting…' : 'Accept job'}
            </button>
            <button type="button" className="ghost-button danger" onClick={handleDecline} disabled={updating}>
              Decline
            </button>
          </>
        )}
        {(job.status === 'provider_assigned' || job.status === 'in_progress') && NEXT_STATUS[job.status] && (
          <button type="button" className="primary-cta" onClick={handleNext} disabled={updating}>
            {updating ? 'Updating…' : NEXT_LABEL[job.status]}
          </button>
        )}
        {isActive && (
          <span className="gps-indicator"><span className="gps-pulse" />GPS broadcasting</span>
        )}
      </div>
    </article>
  );
}
