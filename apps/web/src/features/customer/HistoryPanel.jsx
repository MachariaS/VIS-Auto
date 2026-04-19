import { formatCurrency } from '../../shared/helpers';

export default function HistoryPanel({ requests }) {
  if (requests.length === 0) {
    return <div className="dashboard-panel empty-state">No requests yet.</div>;
  }

  return (
    <section className="dashboard-panel stack">
      <div className="panel-head">
        <div>
          <p className="eyebrow">History</p>
          <h3>Request timeline</h3>
        </div>
      </div>
      <div className="card-list">
        {requests.map((roadsideRequest) => (
          <article className="info-card" key={roadsideRequest.id}>
            <div className="info-top">
              <strong>{roadsideRequest.issueType}</strong>
              <span className="mini-pill">{roadsideRequest.status.replaceAll('_', ' ')}</span>
            </div>
            <p>{roadsideRequest.address}</p>
            <div className="info-meta">
              <span>{roadsideRequest.providerName}</span>
              <span>{roadsideRequest.distanceKm} km</span>
              <span>{roadsideRequest.etaMinutes} min ETA</span>
              <span>{formatCurrency(roadsideRequest.estimatedPriceKsh)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
