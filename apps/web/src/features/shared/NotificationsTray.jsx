import { useEffect, useState, useCallback } from 'react';
import { request } from '../../shared/helpers';

const TYPE_ICON = {
  job_update: '🔧',
  vendor: '🤝',
  auth: '🔒',
  system: '📣',
};

const TYPE_COLOR = {
  job_update: '#84cc16',
  vendor: '#3b82f6',
  auth: '#f59e0b',
  system: '#6b7280',
};

function resolveNavigation(item, userAccountType) {
  const type = item.type;
  if (type === 'job_update') {
    return userAccountType === 'provider' ? 'jobs' : 'history';
  }
  if (type === 'vendor') {
    return userAccountType === 'provider' ? 'vendors' : null;
  }
  return null;
}

function resolveCtaLabel(item, userAccountType) {
  if (item.type === 'job_update') {
    const title = (item.title || '').toLowerCase();
    if (title.includes('new job')) return userAccountType === 'provider' ? 'Accept or decline →' : 'Track request →';
    if (title.includes('complete')) return 'Leave a review →';
    return userAccountType === 'provider' ? 'View jobs →' : 'Track request →';
  }
  if (item.type === 'vendor') return 'Open vendor hub →';
  return null;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsTray({
  token,
  userAccountType = 'provider',
  onClose,
  onNavigate,
  onUnreadChange,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await request('/notifications', undefined, 'GET', token);
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      onUnreadChange?.(list.filter((n) => !n.isRead).length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function markReadOptimistic(id) {
    setItems((prev) => {
      const next = prev.map((n) => n.id === id ? { ...n, isRead: true } : n);
      onUnreadChange?.(next.filter((n) => !n.isRead).length);
      return next;
    });
    // Fire-and-forget — don't await so navigation is instant
    request(`/notifications/${id}/read`, undefined, 'PATCH', token).catch(() => {});
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await request('/notifications/read-all', undefined, 'PATCH', token);
      setItems((prev) => {
        const next = prev.map((n) => ({ ...n, isRead: true }));
        onUnreadChange?.(0);
        return next;
      });
    } catch { /* non-fatal */ } finally {
      setMarkingAll(false);
    }
  }

  function handleItemClick(item) {
    // Mark read immediately (optimistic, no await)
    if (!item.isRead) {
      markReadOptimistic(item.id);
    }

    const tab = resolveNavigation(item, userAccountType);
    if (tab && onNavigate) {
      onNavigate(tab); // closes tray + switches tab
    } else if (onClose) {
      onClose();
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
        {loading && <p className="notifications-empty">Loading…</p>}

        {!loading && items.length === 0 && (
          <div className="notifications-empty">
            <span style={{ fontSize: 32 }}>🔔</span>
            <p>No notifications yet</p>
            <p style={{ fontSize: 12, opacity: 0.6 }}>
              Job updates, vendor activity, and system messages will appear here.
            </p>
          </div>
        )}

        {items.map((item) => {
          const tab = resolveNavigation(item, userAccountType);
          const cta = resolveCtaLabel(item, userAccountType);
          const accentColor = TYPE_COLOR[item.type] ?? '#6b7280';

          return (
            <article
              key={item.id}
              className={`notification-item ${item.isRead ? '' : 'notification-item--unread'} ${tab ? 'notification-item--clickable' : ''}`}
              onClick={() => handleItemClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleItemClick(item)}
            >
              <div className="notification-item-icon" style={{ background: `${accentColor}18`, color: accentColor }}>
                {TYPE_ICON[item.type] ?? '📣'}
              </div>
              <div className="notification-item-body">
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <div className="notification-item-footer">
                  <time>{timeAgo(item.createdAt)}</time>
                  {cta && (
                    <span className="notification-item-cta" style={{ color: accentColor }}>
                      {cta}
                    </span>
                  )}
                </div>
              </div>
              {!item.isRead && <span className="notification-dot" />}
            </article>
          );
        })}
      </div>
    </section>
  );
}
