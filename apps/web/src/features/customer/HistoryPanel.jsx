import { useEffect, useState } from 'react';
import { formatCurrency } from '../../shared/helpers';
import useRequestTracking from './hooks/useRequestTracking';
import TrackingMapCard from './tracking/TrackingMapCard';

function formatTrackingStatus(status) {
  return status.replaceAll('_', ' ');
}

export default function HistoryPanel({ requests, token }) {
  const [selectedRequestId, setSelectedRequestId] = useState('');

  const selectedRequest = requests.find((requestItem) => requestItem.id === selectedRequestId) || requests[0];
  const { tracking, trackingError, trackingLoading } = useRequestTracking({
    token,
    selectedRequest,
  });

  useEffect(() => {
    if (requests.length === 0) {
      if (selectedRequestId) setSelectedRequestId('');
      return;
    }

    if (!requests.some((requestItem) => requestItem.id === selectedRequestId)) {
      setSelectedRequestId(requests[0].id);
    }
  }, [requests, selectedRequestId]);

  if (requests.length === 0) {
    return <div className="dashboard-panel empty-state">No requests yet.</div>;
  }

  return (
    <section className="dashboard-panel stack">
      <div className="panel-head">
        <div>
          <p className="eyebrow">History</p>
          <h3>Request tracking</h3>
        </div>
      </div>

      <div className="request-tracking-layout">
        <div className="request-tracking-list">
          {requests.map((roadsideRequest) => (
            <button
              className={
                selectedRequest?.id === roadsideRequest.id
                  ? 'request-track-card active'
                  : 'request-track-card'
              }
              type="button"
              key={roadsideRequest.id}
              onClick={() => setSelectedRequestId(roadsideRequest.id)}
            >
              <div className="info-top">
                <strong>{roadsideRequest.issueType}</strong>
                <span className="mini-pill">{formatTrackingStatus(roadsideRequest.status)}</span>
              </div>
              <p>{roadsideRequest.address}</p>
              <div className="info-meta">
                <span>{roadsideRequest.providerName}</span>
                <span>{roadsideRequest.distanceKm} km</span>
                <span>{roadsideRequest.etaMinutes} min ETA</span>
                <span>{formatCurrency(roadsideRequest.estimatedPriceKsh)}</span>
              </div>
            </button>
          ))}
        </div>

        {selectedRequest ? (
          <div className="request-tracking-detail">
            <article className="tracking-summary-card">
              <div className="tracking-summary-head">
                <div>
                  <h4>{selectedRequest.issueType}</h4>
                  <p>{selectedRequest.providerName}</p>
                </div>
                <span className="mini-pill">
                  {formatTrackingStatus(tracking?.status || selectedRequest.status)}
                </span>
              </div>

              <div className="tracking-summary-grid">
                <article>
                  <label>Live ETA</label>
                  <strong>{tracking?.etaMinutes ?? selectedRequest.etaMinutes} min</strong>
                </article>
                <article>
                  <label>Destination</label>
                  <strong>{tracking?.address || selectedRequest.address}</strong>
                </article>
                <article>
                  <label>Provider update</label>
                  <strong>
                    {tracking?.updatedAt
                      ? new Date(tracking.updatedAt).toLocaleTimeString('en-KE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Awaiting location ping'}
                  </strong>
                </article>
                <article>
                  <label>Estimate</label>
                  <strong>{formatCurrency(selectedRequest.estimatedPriceKsh)}</strong>
                </article>
              </div>
            </article>

            <TrackingMapCard requestItem={selectedRequest} tracking={tracking} />

            <article className="tracking-summary-card">
              <div className="tracking-summary-head">
                <div>
                  <h4>Tracking feed</h4>
                  <p>Polling every 10 seconds while the request is active.</p>
                </div>
              </div>
              {trackingLoading ? <div className="mini-state">Refreshing live status...</div> : null}
              {trackingError ? <div className="mini-state error">{trackingError}</div> : null}
              <div className="card-list">
                <article className="info-card">
                  <div className="info-top">
                    <strong>Current status</strong>
                    <span className="mini-pill">
                      {formatTrackingStatus(tracking?.status || selectedRequest.status)}
                    </span>
                  </div>
                  <p>{selectedRequest.notes || 'No special instructions were added.'}</p>
                  <div className="info-meta">
                    <span>{selectedRequest.providerName}</span>
                    <span>{tracking?.etaMinutes ?? selectedRequest.etaMinutes} min ETA</span>
                    <span>{selectedRequest.distanceKm} km</span>
                  </div>
                </article>
              </div>
            </article>
          </div>
        ) : null}
      </div>
    </section>
  );
}
