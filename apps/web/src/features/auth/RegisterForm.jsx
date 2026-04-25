export default function RegisterForm({ form, onChange, onSubmit, loading, message }) {
  return (
    <form className="auth-shell stack" onSubmit={onSubmit}>
      <div className="auth-head">
        <span className="mini-pill">Account</span>
        <h2>Create your account</h2>
      </div>

      <div className="auth-type-cards">
        <button
          type="button"
          className={`auth-type-card ${form.accountType === 'car_owner' ? 'auth-type-card--active' : ''}`}
          onClick={() => onChange('accountType', 'car_owner')}
        >
          <span className="auth-type-icon">🚗</span>
          <strong>I am a car owner</strong>
          <p>Request roadside help and manage my vehicles</p>
        </button>
        <button
          type="button"
          className={`auth-type-card ${form.accountType === 'provider' ? 'auth-type-card--active' : ''}`}
          onClick={() => onChange('accountType', 'provider')}
        >
          <span className="auth-type-icon">🔧</span>
          <strong>I offer automotive services</strong>
          <p>Garages, roadside, fuel, cleaning and more</p>
        </button>
      </div>

      <label>
        <span>Full name</span>
        <input
          placeholder="Jane Doe"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          required
        />
      </label>

      <label>
        <span>Email</span>
        <input
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => onChange('email', e.target.value)}
          required
        />
      </label>

      {form.accountType === 'provider' && (
        <label>
          <span>Business / trading name</span>
          <input
            placeholder="Your garage or business name"
            value={form.businessName || ''}
            onChange={(e) => onChange('businessName', e.target.value)}
          />
        </label>
      )}

      <label>
        <span>Phone (optional)</span>
        <input
          placeholder="+254..."
          value={form.phone}
          onChange={(e) => onChange('phone', e.target.value)}
        />
      </label>

      <label>
        <span>Password</span>
        <input
          type="password"
          placeholder="Min 8 chars — uppercase, number, symbol"
          value={form.password}
          onChange={(e) => onChange('password', e.target.value)}
          required
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create account'}
      </button>

      {message ? <div className="status-banner">{message}</div> : null}
    </form>
  );
}
