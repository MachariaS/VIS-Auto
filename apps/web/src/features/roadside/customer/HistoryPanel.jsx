import { lazy, Suspense, useEffect, useState } from 'react';
import { formatCurrency } from '../../../shared/helpers';
import useRequestTracking from './hooks/useRequestTracking';

const MapView = lazy(() => import('../../../shared/MapView'));

const STATUS_LABELS = {
  searching: 'Searching',
  provider_assigned: 'Assigned',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLOR = {
  searching: '#f59e0b',
  provider_assigned: '#84cc16',
  in_progress: '#3b82f6',
  completed: '#10b981',
  cancelled: '#6b7280',
};

const TABS = ['All', 'Active', 'Completed', 'Cancelled'];

function statusGroup(status) {
  if (['searching', 'provider_assigned', 'in_progress'].includes(status)) return 'Active';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return 'All';
}

export default function HistoryPanel({ requests, token }) {
  const [tab, setTab] = useState('All');
  const [selectedId, setSelectedId] = useState(null);

  const filtered = tab === 'All' ? requests : requests.filter((r) => statusGroup(r.status) === tab);
  const selected = requests.find((r) => r.id === selectedId);

  const { tracking } = useRequestTracking({ token, selectedRequest: selected });

  useEffect(() => {
    if (!selectedId && filtered.length > 0) setSelectedId(filtered[0].id);
  }, [filtered.length]);

  const tabCounts = {
    All: requests.length,
    Active: requests.filter((r) => statusGroup(r.status) === 'Active').length,
    Completed: requests.filter((r) => r.status === 'completed').length,
    Cancelled: requests.filter((r) => r.status === 'cancelled').length,
  };

  return (
    <section className="cust-history">
      <div className="cust-history-header">
        <div>
          <p className="eyebrow">Roadside requests</p>
          <h3>Request history</h3>
        </div>
      </div>

      <div className="history-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`history-tab ${tab === t ? 'history-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
            {tabCounts[t] > 0 && <span className="history-tab-count">{tabCounts[t]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="cust-empty">
          <span style={{ fontSize: 32 }}>📋</span>
          <p>No {tab.toLowerCase()} requests.</p>
        </div>
      ) : (
        <>
          <div className="history-table">
            <div className="history-table-head">
              <span>Request ID</span>
              <span>Service</span>
              <span>Location</span>
              <span>Date</span>
              <span>Estimate</span>
              <span>Status</span>
            </div>
            {filtered.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`history-row ${selectedId === r.id ? 'history-row--active' : ''}`}
                onClick={() => setSelectedId(r.id === selectedId ? null : r.id)}
              >
                <span className="history-cell-id">#{r.id.slice(0, 8).toUpperCase()}</span>
                <span className="history-cell-service">{r.issueType}</span>
                <span className="history-cell-location">{r.address || '—'}</span>
                <span className="history-cell-date">
                  {new Date(r.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: '2-digit' })}
                </span>
                <span className="history-cell-amount">{formatCurrency(r.estimatedPriceKsh)}</span>
                <span
                  className="history-cell-status"
                  style={{ color: STATUS_COLOR[r.status] }}
                >
                  {r.status === 'searching' && <span className="status-pulse" />}
                  {STATUS_LABELS[r.status] ?? r.status}
                </span>
              </button>
            ))}
          </div>

          {selected && (
            <div className="history-detail">
              <div className="history-detail-header">
                <div>
                  <p className="eyebrow">Request details</p>
                  <h4>
                    {selected.issueType}
                    <span
                      className="history-detail-badge"
                      style={{ background: STATUS_COLOR[selected.status] + '22', color: STATUS_COLOR[selected.status] }}
                    >
                      {STATUS_LABELS[selected.status]}
                    </span>
                  </h4>
                </div>
                <strong className="history-detail-amount">{formatCurrency(selected.estimatedPriceKsh)}</strong>
              </div>

              <div className="history-detail-grid">
                <article>
                  <label>Provider</label>
                  <strong>{selected.providerName || '—'}</strong>
                </article>
                <article>
                  <label>Distance</label>
                  <strong>{Number(selected.distanceKm).toFixed(1)} km</strong>
                </article>
                <article>
                  <label>ETA</label>
                  <strong>{tracking?.etaMinutes ?? selected.etaMinutes} min</strong>
                </article>
                <article>
                  <label>Date</label>
                  <strong>
                    {new Date(selected.createdAt).toLocaleString('en-KE', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </strong>
                </article>
                {selected.vehicle && (
                  <article>
                    <label>Vehicle served</label>
                    <strong>
                      {selected.vehicle.year} {selected.vehicle.make} {selected.vehicle.model} — {selected.vehicle.registrationNumber}
                    </strong>
                  </article>
                )}
                {selected.notes && (
                  <article style={{ gridColumn: '1 / -1' }}>
                    <label>Notes</label>
                    <strong>{selected.notes}</strong>
                  </article>
                )}
              </div>

              <Suspense fallback={<div className="map-loading">Loading map…</div>}>
                <MapView
                  customerLat={selected.latitude}
                  customerLng={selected.longitude}
                  providerLat={tracking?.providerLatitude}
                  providerLng={tracking?.providerLongitude}
                  customerLabel={selected.address || 'Your location'}
                  providerLabel={selected.providerName || 'Provider'}
                  height={320}
                  className="history-map"
                />
              </Suspense>
            </div>
          )}
        </>
      )}
    </section>
  );
}
