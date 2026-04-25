import { useEffect, useState, useCallback } from 'react';
import { request } from '../../shared/helpers';

const TYPE_ICON = {
  job_update: '🔧',
  vendor: '🤝',
  auth: '🔒',
  system: '📣',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsTray({ token, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await request('/notifications', undefined, 'GET', token);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // silent — tray just stays empty
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function markRead(id) {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    try {
      await request(`/notifications/${id}/read`, undefined, 'PATCH', token);
    } catch { /* non-fatal */ }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await request('/notifications/read-all', undefined, 'PATCH', token);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* non-fatal */ } finally {
      setMarkingAll(false);
    }
  }

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <section className="notifications-tray">
      <div className="notifications-tray-head">
        <div>
          <p className="eyebrow">Notifications</p>
          <h3>
            Recent updates
            {unread > 0 && <span className="notif-unread-pill">{unread} new</span>}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unread > 0 && (
            <button className="ghost-button" type="button" onClick={markAllRead} disabled={markingAll}>
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          )}
          {onClose && (
            <button className="icon-button" type="button" onClick={onClose} aria-label="Close">✕</button>
          )}
        </div>
      </div>

      <div className="notifications-list">
        {loading && (
          <p className="notifications-empty">Loading…</p>
        )}

        {!loading && items.length === 0 && (
          <div className="notifications-empty">
            <span style={{ fontSize: 32 }}>🔔</span>
            <p>No notifications yet</p>
            <p style={{ fontSize: 12, opacity: 0.6 }}>Job updates, vendor activity, and system messages will appear here.</p>
          </div>
        )}

        {items.map((item) => (
          <article
            key={item.id}
            className={`notification-item ${item.isRead ? '' : 'notification-item--unread'}`}
            onClick={() => !item.isRead && markRead(item.id)}
          >
            <div className="notification-item-icon">
              {TYPE_ICON[item.type] ?? '📣'}
            </div>
            <div className="notification-item-body">
              <strong>{item.title}</strong>
              <p>{item.body}</p>
              <time>{timeAgo(item.createdAt)}</time>
            </div>
            {!item.isRead && <span className="notification-dot" />}
          </article>
        ))}
      </div>
    </section>
  );
}
