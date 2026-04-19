import { staticNotifications } from '../../shared/constants';

export default function NotificationsTray({ pendingVendorRequests, onOpenVendorRequest }) {
  const integrationAlerts = (pendingVendorRequests || []).map((requestItem) => ({
    id: `integration-${requestItem.id}`,
    title: `Integration request: ${requestItem.name}`,
    body: `${requestItem.category || 'General service'} • Requested ${requestItem.requestedAt || 'today'}`,
    requestId: requestItem.id,
  }));

  return (
    <section className="floating-panel">
      <div className="panel-head compact">
        <div>
          <p className="eyebrow">Notifications</p>
          <h3>Recent updates</h3>
        </div>
      </div>
      <div className="notification-list">
        {integrationAlerts.map((item) => (
          <article className="notification-item" key={item.id}>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            <button
              className="link-button"
              type="button"
              onClick={() => onOpenVendorRequest(item.requestId)}
            >
              Open review
            </button>
          </article>
        ))}
        {staticNotifications.map((item) => (
          <article className="notification-item" key={item.id}>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
