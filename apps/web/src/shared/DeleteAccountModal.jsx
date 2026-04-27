import { useState } from 'react';
import { request } from './helpers';

export default function DeleteAccountModal({ token, onConfirm, onClose }) {
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  async function handleDelete() {
    if (!confirmed) { setError('Please check the confirmation box first.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setDeleting(true);
    setError('');
    try {
      await request('/users/me', { password }, 'DELETE', token);
      onConfirm();
    } catch (e) {
      setError(e.message || 'Unable to delete account. Check your password.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="delete-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="delete-modal">
        <div className="delete-modal-head">
          <span className="delete-modal-icon">⚠️</span>
          <h3>Delete your account</h3>
          <p>This is permanent and cannot be undone. All your data will be erased.</p>
        </div>

        <div className="delete-modal-body">
          <div className="delete-what-goes">
            <p className="delete-section-label">What will be deleted</p>
            <ul>
              <li>Your profile and login credentials</li>
              <li>All vehicles and service history</li>
              <li>All roadside requests</li>
              <li>Ratings, notifications, and vendor connections</li>
              {/* provider-only */}
              <li>All published services (if provider)</li>
            </ul>
          </div>

          <label className="delete-confirm-checkbox">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>I understand this is permanent and cannot be reversed</span>
          </label>

          <label>
            <span>Confirm with your password</span>
            <input
              type="password"
              placeholder="Enter your current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && <div className="status-banner">{error}</div>}
        </div>

        <div className="delete-modal-actions">
          <button className="ghost-button" type="button" onClick={onClose} disabled={deleting}>
            Cancel — keep my account
          </button>
          <button
            className="danger-cta"
            type="button"
            onClick={handleDelete}
            disabled={!confirmed || !password || deleting}
          >
            {deleting ? 'Deleting…' : 'Delete my account permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
