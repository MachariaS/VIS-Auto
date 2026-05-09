import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { initialPasswordForm } from '../../shared/constants';

const FUEL_BRANDS = ['Shell', 'Total', 'Rubis', 'Kenol', 'OiLibya', 'Vivo'];
const RATING_MARKS = [0, 3.0, 3.5, 4.0, 4.5, 5.0];

export default function SettingsPanel() {
  const {
    profileSettings,
    profileSaving,
    passwordSaving,
    handleProfileFieldChange,
    handlePreferenceThemeChange,
    handleSaveProfile,
    handlePasswordReset,
    setMessage,
  } = useApp();

  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);

  async function onPasswordReset(event) {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New password and confirmation must match.');
      return;
    }
    const success = await handlePasswordReset({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    if (success) {
      setPasswordForm(initialPasswordForm);
    }
  }

  const dispatch = profileSettings.preferences?.dispatch ?? {};
  const favouriteProviders = dispatch.favouriteProviders ?? [];
  const preferredFuelBrands = dispatch.preferredFuelBrands ?? [];
  const minProviderRating = dispatch.minProviderRating ?? 0;

  function updateDispatch(key, value) {
    handleProfileFieldChange('preferences', 'dispatch', { ...dispatch, [key]: value });
  }

  function toggleFuelBrand(brand) {
    const next = preferredFuelBrands.includes(brand)
      ? preferredFuelBrands.filter((b) => b !== brand)
      : [...preferredFuelBrands, brand];
    updateDispatch('preferredFuelBrands', next);
  }

  function removeFavouriteProvider(id) {
    updateDispatch('favouriteProviders', favouriteProviders.filter((p) => p.id !== id));
  }

  return (
    <form className="settings-grid-v2" onSubmit={handleSaveProfile}>
      <section className="dashboard-panel stack">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Notifications</p>
            <h3>Alert settings</h3>
          </div>
        </div>
        <div className="toggle-list">
          {[
            ['emailAlerts', 'Email alerts'],
            ['smsAlerts', 'SMS alerts'],
            ['pushAlerts', 'Push alerts'],
            ['marketing', 'Product updates'],
          ].map(([key, label]) => (
            <label className="toggle-row" key={key}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={profileSettings.notifications[key]}
                onChange={(event) =>
                  handleProfileFieldChange('notifications', key, event.target.checked)
                }
              />
            </label>
          ))}
        </div>
      </section>

      <section className="dashboard-panel stack">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Preferences</p>
            <h3>Experience and theme</h3>
          </div>
        </div>
        <div className="form-grid">
          <label>
            <span>Theme</span>
            <select
              value={profileSettings.preferences.theme}
              onChange={(event) => handlePreferenceThemeChange(event.target.value)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          <label>
            <span>Language</span>
            <select
              value={profileSettings.preferences.language}
              onChange={(event) =>
                handleProfileFieldChange('preferences', 'language', event.target.value)
              }
            >
              <option value="English">English</option>
              <option value="Swahili">Swahili</option>
            </select>
          </label>
        </div>
        <label className="toggle-row">
          <span>Compact mode</span>
          <input
            type="checkbox"
            checked={profileSettings.preferences.compactMode}
            onChange={(event) =>
              handleProfileFieldChange('preferences', 'compactMode', event.target.checked)
            }
          />
        </label>
      </section>

      <div className="dashboard-panel stack">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Security</p>
            <h3>Password reset</h3>
          </div>
        </div>
        <label>
          <span>Current password</span>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(event) =>
              setPasswordForm({ ...passwordForm, currentPassword: event.target.value })
            }
          />
        </label>
        <label>
          <span>New password</span>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(event) =>
              setPasswordForm({ ...passwordForm, newPassword: event.target.value })
            }
          />
        </label>
        <label>
          <span>Confirm password</span>
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(event) =>
              setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })
            }
          />
        </label>
        <button className="form-primary-action" type="button" onClick={onPasswordReset} disabled={passwordSaving}>
          {passwordSaving ? 'Updating...' : 'Update password'}
        </button>
      </div>

      <section className="dashboard-panel stack">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Billing</p>
            <h3>Subscription and invoices</h3>
          </div>
        </div>
        <div className="billing-strip">
          <article className="billing-card">
            <span>Plan</span>
            <strong>{profileSettings.subscription.plan}</strong>
          </article>
          <article className="billing-card">
            <span>Status</span>
            <strong>{profileSettings.subscription.status}</strong>
          </article>
          <article className="billing-card">
            <span>Renewal</span>
            <strong>{profileSettings.subscription.renewalDate}</strong>
          </article>
        </div>
        <label>
          <span>Billing email</span>
          <input
            value={profileSettings.subscription.billingEmail}
            onChange={(event) =>
              handleProfileFieldChange('subscription', 'billingEmail', event.target.value)
            }
          />
        </label>
        <div className="billing-note">
          <strong>Invoices and payment methods</strong>
          <p>Recurring billing, receipts, and active subscriptions will connect here next.</p>
        </div>
      </section>
      <section className="dashboard-panel stack">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Dispatch preferences</p>
            <h3>Provider matching</h3>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary, #94a3b8)', margin: '0 0 16px' }}>
          These signals improve which provider gets dispatched to you automatically.
        </p>

        <div>
          <span className="field-label" style={{ display: 'block', marginBottom: 8 }}>Preferred fuel brands</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FUEL_BRANDS.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => toggleFuelBrand(brand)}
                style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                  border: `1.5px solid ${preferredFuelBrands.includes(brand) ? '#84cc16' : 'rgba(255,255,255,0.12)'}`,
                  background: preferredFuelBrands.includes(brand) ? 'rgba(132,204,22,0.12)' : 'transparent',
                  color: preferredFuelBrands.includes(brand) ? '#84cc16' : 'inherit',
                  fontWeight: preferredFuelBrands.includes(brand) ? 600 : 400,
                  transition: 'all .15s',
                }}
              >
                {brand}
              </button>
            ))}
          </div>
          {preferredFuelBrands.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 6 }}>
              No preference — any fuel provider will be dispatched.
            </p>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="field-label">Minimum provider rating</span>
            <strong style={{ color: '#84cc16', fontSize: 14 }}>
              {minProviderRating === 0 ? 'No floor' : `${minProviderRating}★ minimum`}
            </strong>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={minProviderRating}
            onChange={(e) => updateDispatch('minProviderRating', Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary, #94a3b8)', marginTop: 4 }}>
            {RATING_MARKS.map((m) => <span key={m}>{m === 0 ? 'Any' : `${m}★`}</span>)}
          </div>
        </div>

        <div>
          <span className="field-label" style={{ display: 'block', marginBottom: 8 }}>
            Favourite providers
            <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginLeft: 8 }}>
              Auto-added when you rate 4★+
            </span>
          </span>
          {favouriteProviders.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>
              No favourite providers yet. Rate a provider 4+ stars after a job to add them.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {favouriteProviders.map((p) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'rgba(132,204,22,0.15)', color: '#84cc16',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700,
                    }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 14 }}>{p.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFavouriteProvider(p.id)}
                    style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="form-actions">
        <button className="primary-cta" type="submit" disabled={profileSaving}>
          {profileSaving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
