import { useEffect, useState } from 'react';
import { getApiUrl, request } from '../../shared/helpers';

export default function ServiceSelectionPanel({ token, user, onComplete }) {
  const [catalog, setCatalog] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(getApiUrl('/service-catalog'))
      .then((r) => r.json())
      .then((data) => setCatalog(Array.isArray(data) ? data : []))
      .catch(() => setMessage('Unable to load service catalog.'))
      .finally(() => setCatalogLoading(false));
  }, []);

  function toggleService(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirm() {
    if (selected.size === 0) {
      setMessage('Select at least one service to continue.');
      return;
    }
    setLoading(true);
    try {
      await request('/provider-services/bulk', {
        serviceCatalogIds: [...selected],
      }, 'POST', token);
      onComplete();
    } catch (error) {
      setMessage(error.message || 'Unable to save services.');
    } finally {
      setLoading(false);
    }
  }

  if (catalogLoading) {
    return (
      <div className="auth-shell">
        <p>Loading service catalog...</p>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-head">
        <span className="mini-pill">Services</span>
        <h2>What services do you offer?</h2>
        <p className="auth-copy">
          Select every service your business provides. You can update this later.
        </p>
      </div>

      {catalog.map((group) => (
        <section key={group.category} className="service-catalog-group">
          <h4 className="service-catalog-category">{group.category}</h4>
          <div className="service-catalog-grid">
            {group.services.map((service) => (
              <button
                key={service.id}
                type="button"
                className={`service-catalog-card ${selected.has(service.id) ? 'service-catalog-card--selected' : ''}`}
                onClick={() => toggleService(service.id)}
              >
                <strong>{service.name}</strong>
                {service.description && <p>{service.description}</p>}
                {selected.has(service.id) && <span className="service-catalog-check">✓</span>}
              </button>
            ))}
          </div>
        </section>
      ))}

      {message ? <div className="status-banner">{message}</div> : null}

      <div className="auth-actions">
        <button type="button" onClick={handleConfirm} disabled={loading || selected.size === 0}>
          {loading ? 'Saving...' : `Confirm ${selected.size > 0 ? `(${selected.size} selected)` : ''}`}
        </button>
        <p className="auth-copy-small">Minimum 1 service required</p>
      </div>
    </div>
  );
}
