import { useEffect, useState } from 'react';
import { formatCurrency, getApiUrl } from '../../../shared/helpers';

function StarBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="star-bar-row">
      <span className="star-bar-label">{star}★</span>
      <div className="star-bar-track">
        <div className="star-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="star-bar-count">{count}</span>
    </div>
  );
}

export default function ProviderProfileCard({ providerId, onClose, isFavourite = false, onToggleFavourite }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerId) return;
    setLoading(true);
    fetch(getApiUrl(`/providers/${providerId}/profile`))
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [providerId]);

  return (
    <div className="provider-profile-backdrop" onClick={onClose}>
      <div className="provider-profile-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 8 }}>
          {onToggleFavourite && (
            <button
              type="button"
              onClick={onToggleFavourite}
              title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
              style={{
                background: isFavourite ? 'rgba(132,204,22,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isFavourite ? '#84cc16' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16,
                color: isFavourite ? '#84cc16' : 'inherit', transition: 'all .15s',
              }}
            >
              {isFavourite ? '★' : '☆'}
            </button>
          )}
          <button type="button" className="provider-profile-close" onClick={onClose}>✕</button>
        </div>

        {loading && <p className="provider-profile-loading">Loading profile…</p>}

        {!loading && !profile && (
          <p className="provider-profile-loading">Profile unavailable.</p>
        )}

        {!loading && profile && (
          <>
            <div className="provider-profile-head">
              <div className="provider-profile-avatar">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3>{profile.name}</h3>
                <p className="provider-profile-since">
                  Member since {new Date(profile.memberSince).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            <div className="provider-profile-stats">
              <div className="provider-stat-pill">
                <strong>{profile.avgRating !== null ? `★ ${profile.avgRating}` : '—'}</strong>
                <span>{profile.ratingCount} review{profile.ratingCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="provider-stat-pill">
                <strong>{profile.completedJobs}</strong>
                <span>Jobs done</span>
              </div>
              {profile.completionRate !== null && (
                <div className="provider-stat-pill">
                  <strong>{profile.completionRate}%</strong>
                  <span>Completion</span>
                </div>
              )}
            </div>

            {profile.ratingCount > 0 && (
              <div className="provider-profile-section">
                <h4>Ratings</h4>
                <div className="star-breakdown">
                  {profile.starBreakdown.map((s) => (
                    <StarBar key={s.star} star={s.star} count={s.count} total={profile.ratingCount} />
                  ))}
                </div>
              </div>
            )}

            {profile.recentReviews.length > 0 && (
              <div className="provider-profile-section">
                <h4>Recent reviews</h4>
                {profile.recentReviews.map((r, i) => (
                  <div key={i} className="provider-review-row">
                    <div className="provider-review-top">
                      <span className="provider-review-stars">{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</span>
                      <span className="provider-review-name">{r.customerName}</span>
                    </div>
                    <p className="provider-review-comment">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {profile.services.length > 0 && (
              <div className="provider-profile-section">
                <h4>Services offered</h4>
                <div className="provider-profile-services">
                  {profile.services.map((s, i) => (
                    <div key={i} className="provider-profile-service-chip">
                      <strong>{s.serviceName}</strong>
                      {s.basePriceKsh > 0 && <span>from {formatCurrency(s.basePriceKsh)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
