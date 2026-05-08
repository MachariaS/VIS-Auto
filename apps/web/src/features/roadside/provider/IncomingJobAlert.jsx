import { useEffect, useRef, useState } from 'react';
import { formatCurrency, request } from '../../../shared/helpers';

const WINDOW_SECS = 120;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function EtaBadge({ distKm }) {
  if (!distKm) return null;
  const mins = Math.max(1, Math.ceil(distKm * 2));
  return <span className="incoming-eta-badge">~{mins} min away</span>;
}

function CountdownBar({ dispatchedAt }) {
  const [secsLeft, setSecsLeft] = useState(() => {
    if (!dispatchedAt) return WINDOW_SECS;
    const elapsed = Math.floor((Date.now() - new Date(dispatchedAt).getTime()) / 1000);
    return Math.max(0, WINDOW_SECS - elapsed);
  });

  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setSecsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(intervalRef.current);
  }, []);

  const pct = Math.round((secsLeft / WINDOW_SECS) * 100);
  const urgent = secsLeft <= 30;

  return (
    <div className="incoming-countdown">
      <div className="incoming-countdown-track">
        <div
          className={`incoming-countdown-fill ${urgent ? 'incoming-countdown-fill--urgent' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`incoming-countdown-label ${urgent ? 'incoming-countdown-label--urgent' : ''}`}>
        {secsLeft}s to respond
      </span>
    </div>
  );
}

export default function IncomingJobAlert({ job, token, providerBaseLat, providerBaseLng, onStatusChange }) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const distKm = providerBaseLat && providerBaseLng && job.latitude && job.longitude
    ? haversineKm(Number(providerBaseLat), Number(providerBaseLng), Number(job.latitude), Number(job.longitude))
    : job.distanceKm ? Number(job.distanceKm) : null;

  async function handleAccept() {
    setAccepting(true);
    try {
      await request(`/roadside-requests/${job.id}/status`, { status: 'provider_assigned' }, 'PATCH', token);
      await onStatusChange();
    } catch {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    try {
      // Decline triggers re-dispatch to next provider (does NOT cancel the job)
      await request(`/roadside-requests/${job.id}/decline`, undefined, 'POST', token);
      await onStatusChange();
    } catch {
      setDeclining(false);
    }
  }

  return (
    <article className="incoming-job-alert">
      <div className="incoming-job-alert-pulse" />

      <div className="incoming-job-alert-header">
        <div className="incoming-job-alert-title">
          <span className="incoming-job-new-badge">New request</span>
          <h4>{job.issueType}</h4>
        </div>
        <div className="incoming-job-alert-earn">
          <strong>{formatCurrency(job.estimatedPriceKsh)}</strong>
          <span>Estimated</span>
        </div>
      </div>

      <CountdownBar dispatchedAt={job.dispatchedAt} />

      <div className="incoming-job-alert-details">
        {job.address && (
          <div className="incoming-detail-row">
            <span className="incoming-detail-icon">📍</span>
            <span>{job.address}{job.landmark ? ` — ${job.landmark}` : ''}</span>
          </div>
        )}
        {distKm !== null && (
          <div className="incoming-detail-row">
            <span className="incoming-detail-icon">📏</span>
            <span>{distKm.toFixed(1)} km from your base</span>
            <EtaBadge distKm={distKm} />
          </div>
        )}
        {job.customer?.name && (
          <div className="incoming-detail-row">
            <span className="incoming-detail-icon">👤</span>
            <span>{job.customer.name}</span>
          </div>
        )}
      </div>

      <div className="incoming-job-alert-actions">
        <button
          type="button"
          className="primary-cta incoming-accept-btn"
          onClick={handleAccept}
          disabled={accepting || declining}
        >
          {accepting ? 'Accepting…' : '✓ Accept job'}
        </button>
        <button
          type="button"
          className="ghost-button danger"
          onClick={handleDecline}
          disabled={accepting || declining}
        >
          {declining ? 'Declining…' : 'Decline'}
        </button>
      </div>
    </article>
  );
}
