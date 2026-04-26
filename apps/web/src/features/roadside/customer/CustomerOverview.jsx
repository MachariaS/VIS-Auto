import { formatCurrency } from '../../../shared/helpers';

const STATUS_COLORS = {
  searching: '#f59e0b',
  provider_assigned: '#84cc16',
  in_progress: '#3b82f6',
  completed: '#10b981',
  cancelled: '#6b7280',
};

const STATUS_LABELS = {
  searching: 'Searching',
  provider_assigned: 'Assigned',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function StatCard({ value, label, color }) {
  return (
    <article className="cust-stat-card" style={{ '--stat-color': color }}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

export default function CustomerOverview({ requests, vehicles, onNewRequest, onViewHistory }) {
  const active = requests.filter((r) => ['searching', 'provider_assigned', 'in_progress'].includes(r.status));
  const completed = requests.filter((r) => r.status === 'completed');
  const totalSpend = completed.reduce((sum, r) => sum + (r.estimatedPriceKsh || 0), 0);
  const recent = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <section className="cust-overview">
      <div className="cust-overview-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h3>Driver overview</h3>
        </div>
        <button className="primary-cta" type="button" onClick={onNewRequest}>
          New roadside request
        </button>
      </div>

      <div className="cust-stat-strip">
        <StatCard value={active.length} label="Active requests" color="#f59e0b" />
        <StatCard value={completed.length} label="Completed" color="#10b981" />
        <StatCard value={vehicles.length} label="Vehicles" color="#3b82f6" />
        <StatCard value={formatCurrency(totalSpend)} label="Total spend" color="#84cc16" />
      </div>

      {active.length > 0 && (
        <div className="cust-active-alert">
          <span className="cust-active-dot" />
          <span>
            You have {active.length} active request{active.length > 1 ? 's' : ''} right now
          </span>
          <button className="link-button" type="button" onClick={onViewHistory}>View</button>
        </div>
      )}

      <div className="cust-recent">
        <div className="cust-section-head">
          <h4>Recent requests</h4>
          {requests.length > 5 && (
            <button className="link-button" type="button" onClick={onViewHistory}>View all</button>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="cust-empty">
            <span style={{ fontSize: 32 }}>🚗</span>
            <p>No requests yet — tap "New roadside request" to get started.</p>
          </div>
        ) : (
          <div className="cust-request-table">
            <div className="cust-request-table-head">
              <span>Service</span>
              <span>Location</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {recent.map((r) => (
              <button
                key={r.id}
                type="button"
                className="cust-request-row"
                onClick={onViewHistory}
              >
                <span className="cust-row-service">{r.issueType}</span>
                <span className="cust-row-location">{r.address || '—'}</span>
                <span className="cust-row-date">
                  {new Date(r.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                </span>
                <span className="cust-row-amount">{formatCurrency(r.estimatedPriceKsh)}</span>
                <span
                  className="cust-row-status"
                  style={{ color: STATUS_COLORS[r.status] }}
                >
                  {STATUS_LABELS[r.status] ?? r.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
