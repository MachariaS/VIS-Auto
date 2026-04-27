import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { countryOptions } from '../../../shared/constants';
import PhoneField from '../../../shared/PhoneField';
import DeleteAccountModal from '../../../shared/DeleteAccountModal';

const THEMES = [
  { value: 'dark',  label: '🌙 Dark',  desc: 'Easy on the eyes at night' },
  { value: 'light', label: '☀️ Light', desc: 'Clean and bright' },
];

const NOTIFICATION_PREFS = [
  { key: 'jobUpdates',    label: 'Job status updates',   desc: 'Provider assigned, en route, completed' },
  { key: 'offerAlerts',  label: 'Offers & promotions',   desc: 'Discounts and seasonal deals' },
  { key: 'reminders',    label: 'Maintenance reminders', desc: 'Next service and inspection alerts' },
  { key: 'soundAlerts',  label: 'Sound notifications',   desc: 'Play a chime when new alerts arrive' },
];

export default function CustomerProfilePanel({ providerCatalog = [] }) {
  const {
    user, token, message, profileSettings, profileSaving, profileLoading,
    handleProfileFieldChange, handleSaveProfile, theme, toggleTheme, signOut,
  } = useApp();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const prefs = profileSettings.preferences ?? {};
  const notifPrefs = prefs.notifications ?? {};
  const account = profileSettings.account ?? {};
  const favProviders = prefs.favouriteProviders ?? [];

  function setNotifPref(key, value) {
    handleProfileFieldChange('preferences', 'notifications', { ...notifPrefs, [key]: value });
  }

  function toggleFavProvider(providerId, providerName) {
    const exists = favProviders.some((p) => p.id === providerId);
    const next = exists
      ? favProviders.filter((p) => p.id !== providerId)
      : [...favProviders, { id: providerId, name: providerName }];
    handleProfileFieldChange('preferences', 'favouriteProviders', next);
  }

  const uniqueProviders = Array.from(
    new Map(providerCatalog.map((s) => [s.providerId, { id: s.providerId, name: s.providerName }])).values(),
  );

  return (
    <div className="cust-profile">
      <div className="cust-profile-head">
        <div>
          <p className="eyebrow">Profile</p>
          <h3>Account &amp; settings</h3>
        </div>
        <button className="primary-cta" type="button" onClick={handleSaveProfile} disabled={profileSaving || profileLoading}>
          {profileSaving ? 'Saving…' : profileLoading ? 'Loading…' : 'Save profile'}
        </button>
      </div>

      {message && <div className="status-banner">{message}</div>}

      <div className="cust-profile-grid">

        {/* ── Account details ── */}
        <div className="cust-profile-main">
          <div className="cust-profile-section">
            <h4 className="cust-profile-section-title">Account details</h4>
            <div className="form-grid">
              <label>
                <span>Display name</span>
                <input value={account.displayName ?? user?.name ?? ''}
                  onChange={(e) => handleProfileFieldChange('account', 'displayName', e.target.value)} />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={account.email ?? user?.email ?? ''}
                  onChange={(e) => handleProfileFieldChange('account', 'email', e.target.value)} />
              </label>
              <label>
                <span>Phone number</span>
                <PhoneField
                  value={account.phone ?? user?.phone ?? ''}
                  onChange={(v) => handleProfileFieldChange('account', 'phone', v)}
                />
              </label>
              <label>
                <span>Default location</span>
                <input placeholder="e.g. Nairobi, Kenya" value={account.location ?? ''}
                  onChange={(e) => handleProfileFieldChange('account', 'location', e.target.value)} />
              </label>
              <label>
                <span>Country</span>
                <select value={prefs.country ?? 'KE'}
                  onChange={(e) => handleProfileFieldChange('preferences', 'country', e.target.value)}>
                  {countryOptions.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* ── Notifications ── */}
          <div className="cust-profile-section">
            <h4 className="cust-profile-section-title">Notifications &amp; alerts</h4>
            <div className="cust-notif-list">
              {NOTIFICATION_PREFS.map(({ key, label, desc }) => (
                <label key={key} className="cust-notif-row">
                  <div>
                    <strong>{label}</strong>
                    <span>{desc}</span>
                  </div>
                  <div className="cust-toggle-wrap">
                    <input
                      type="checkbox"
                      className="cust-toggle"
                      checked={notifPrefs[key] !== false}
                      onChange={(e) => setNotifPref(key, e.target.checked)}
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ── Theme ── */}
          <div className="cust-profile-section">
            <h4 className="cust-profile-section-title">Appearance</h4>
            <div className="cust-theme-grid">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`cust-theme-card ${theme === t.value ? 'cust-theme-card--active' : ''}`}
                  onClick={() => theme !== t.value && toggleTheme()}
                >
                  <strong>{t.label}</strong>
                  <span>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Preferred providers sidebar ── */}
        <div className="cust-profile-sidebar">
          <div className="cust-profile-section">
            <h4 className="cust-profile-section-title">Preferred providers</h4>
            <p className="cust-profile-section-hint">
              Starred providers appear first when you request a service.
            </p>

            {favProviders.length > 0 && (
              <div className="cust-fav-list">
                {favProviders.map((p) => (
                  <div key={p.id} className="cust-fav-row">
                    <div className="cust-fav-avatar">{(p.name || '?').charAt(0).toUpperCase()}</div>
                    <span>{p.name}</span>
                    <button type="button" className="cust-fav-remove"
                      onClick={() => toggleFavProvider(p.id, p.name)} title="Remove">✕</button>
                  </div>
                ))}
              </div>
            )}

            {uniqueProviders.length > 0 ? (
              <div className="cust-provider-picker">
                <p style={{ fontSize: 12, color: 'var(--text-soft)', margin: '8px 0 6px' }}>
                  Add from available providers:
                </p>
                {uniqueProviders
                  .filter((p) => !favProviders.some((f) => f.id === p.id))
                  .map((p) => (
                    <button key={p.id} type="button" className="cust-provider-add-row"
                      onClick={() => toggleFavProvider(p.id, p.name)}>
                      <div className="cust-fav-avatar">{p.name.charAt(0).toUpperCase()}</div>
                      <span>{p.name}</span>
                      <span className="cust-provider-add-icon">+</span>
                    </button>
                  ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 8 }}>
                Providers will appear here once services are available in your area.
              </p>
            )}
          </div>

          <div className="cust-profile-section">
            <h4 className="cust-profile-section-title">Default garage</h4>
            <label>
              <span>Preferred garage / provider name</span>
              <input
                placeholder="e.g. Quick Fix Garage"
                value={prefs.defaultGarage ?? ''}
                onChange={(e) => handleProfileFieldChange('preferences', 'defaultGarage', e.target.value)}
              />
            </label>
            <label style={{ marginTop: 10 }}>
              <span>Garage location</span>
              <input
                placeholder="e.g. Westlands, Nairobi"
                value={prefs.defaultGarageLocation ?? ''}
                onChange={(e) => handleProfileFieldChange('preferences', 'defaultGarageLocation', e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div className="danger-zone">
        <div className="danger-zone-head">
          <h4>Danger zone</h4>
          <p>Permanent actions that cannot be reversed.</p>
        </div>
        <div className="danger-zone-row">
          <div>
            <strong>Delete account</strong>
            <p>Permanently delete your account and all associated data.</p>
          </div>
          <button
            type="button"
            className="danger-cta"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          token={token}
          onConfirm={signOut}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
