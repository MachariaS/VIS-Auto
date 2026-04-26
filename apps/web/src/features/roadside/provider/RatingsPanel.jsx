import { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { request } from '../../../shared/helpers';

function StarRow({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rating-bar-row">
      <span className="rating-bar-label">{star}★</span>
      <div className="rating-bar-track">
        <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="rating-bar-count">{count}</span>
    </div>
  );
}

function StarDisplay({ score, size = 14 }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= score ? '#f59e0b' : 'var(--border-soft)' }}>★</span>
      ))}
    </span>
  );
}

export default function RatingsPanel() {
  const { user, token } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !token) return;
    request(`/providers/${user.id}/ratings`, undefined, 'GET', token)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user?.id, token]);

  return (
    <section className="dashboard-panel stack">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Ratings and reviews</p>
          <h3>Provider quality signals</h3>
        </div>
      </div>

      {loading && <p className="section-note">Loading ratings…</p>}

      {!loading && (!data || data.count === 0) && (
        <p className="section-note">
          No ratings yet. Ratings appear here once customers complete jobs and leave reviews.
        </p>
      )}

      {!loading && data && data.count > 0 && (
        <>
          <div className="ratings-summary">
            <div className="ratings-score-block">
              <span className="ratings-big-score">{data.average}</span>
              <StarDisplay score={Math.round(data.average)} size={20} />
              <span className="ratings-count-label">{data.count} review{data.count !== 1 ? 's' : ''}</span>
            </div>
            <div className="ratings-bars">
              {data.distribution.map(({ star, count }) => (
                <StarRow key={star} star={star} count={count} total={data.count} />
              ))}
            </div>
          </div>

          <div className="ratings-review-list">
            {data.reviews.map((r) => (
              <article key={r.id} className="ratings-review-card">
                <div className="ratings-review-head">
                  <StarDisplay score={r.score} size={14} />
                  <time className="ratings-review-date">
                    {new Date(r.createdAt).toLocaleDateString('en-KE', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </time>
                </div>
                {r.comment && <p className="ratings-review-comment">{r.comment}</p>}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
