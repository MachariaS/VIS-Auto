import { useState } from 'react';
import { request } from '../../shared/helpers';
import { initialVehicle } from '../../shared/constants';
import VehicleMakeModelFields from '../../shared/VehicleMakeModelFields';

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

      <VehicleMakeModelFields
        make={form.make}
        model={form.model}
        year={form.year}
        onChange={onChange}
      />

      <label>
        <span>Registration plate</span>
        <input
          placeholder="KCA 000A"
          value={form.registrationNumber}
          onChange={(e) => onChange('registrationNumber', e.target.value)}
          required
        />
      </label>

      <button className="form-primary-action" type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Add vehicle'}
      </button>

      <button type="button" className="ghost-button" onClick={onSkip}>
        Skip for now
      </button>

      {message ? <div className="status-banner">{message}</div> : null}
    </form>
  );
}
