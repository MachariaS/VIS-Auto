import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { initialPasswordForm } from '../../shared/constants';

export default function SettingsPanel() {
  const {
    profileSettings,
    handleProfileFieldChange,
    handlePreferenceThemeChange,
    handleSaveProfile,
    setMessage,
  } = useApp();

  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);

  function handlePasswordReset(event) {
    event.preventDefault();
    setMessage('Secure password reset will connect to backend email delivery next.');
    setPasswordForm(initialPasswordForm);
  }

  return (
    <section className="settings-grid-v2">
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

      <form className="dashboard-panel stack" onSubmit={handlePasswordReset}>
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
        <button type="submit">Update password</button>
      </form>

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
    </section>
  );
}
