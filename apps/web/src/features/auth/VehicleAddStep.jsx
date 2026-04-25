import { useState } from 'react';
import { request } from '../../shared/helpers';
import { initialVehicle } from '../../shared/constants';

export default function VehicleAddStep({ token, onComplete, onSkip }) {
  const [form, setForm] = useState(initialVehicle);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function onChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await request('/vehicles', form, 'POST', token);
      onComplete();
    } catch (error) {
      setMessage(error.message || 'Unable to add vehicle.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-shell stack" onSubmit={handleSubmit}>
      <div className="auth-head">
        <span className="mini-pill">Vehicle</span>
        <h2>Add your first vehicle</h2>
        <p className="auth-copy">You can skip this and add vehicles from your dashboard.</p>
      </div>

      <label>
        <span>Nickname</span>
        <input
          placeholder="e.g. My Toyota"
          value={form.nickname}
          onChange={(e) => onChange('nickname', e.target.value)}
          required
        />
      </label>

      <label>
        <span>Make</span>
        <input
          placeholder="Toyota"
          value={form.make}
          onChange={(e) => onChange('make', e.target.value)}
          required
        />
      </label>

      <label>
        <span>Model</span>
        <input
          placeholder="Corolla"
          value={form.model}
          onChange={(e) => onChange('model', e.target.value)}
          required
        />
      </label>

      <label>
        <span>Year</span>
        <input
          type="number"
          value={form.year}
          onChange={(e) => onChange('year', Number(e.target.value))}
          required
        />
      </label>

      <label>
        <span>Registration plate</span>
        <input
          placeholder="KCA 000A"
          value={form.registrationNumber}
          onChange={(e) => onChange('registrationNumber', e.target.value)}
          required
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Add vehicle'}
      </button>

      <button type="button" className="ghost-button" onClick={onSkip}>
        Skip for now
      </button>

      {message ? <div className="status-banner">{message}</div> : null}
    </form>
  );
}
