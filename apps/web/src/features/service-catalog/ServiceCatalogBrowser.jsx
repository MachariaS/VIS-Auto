import { useEffect, useState } from 'react';
import { getApiUrl, request } from '../../shared/helpers';

export default function ServiceCatalogBrowser({ token, existingServiceCatalogIds = [], onAdded, onClose }) {
  const [catalog, setCatalog] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [message, setMessage] = useState('');

  const existingSet = new Set(existingServiceCatalogIds);

  useEffect(() => {
    fetch(getApiUrl('/service-catalog'))
      .then((r) => r.json())
      .then((data) => setCatalog(Array.isArray(data) ? data : []))
      .catch(() => setMessage('Unable to load catalog.'))
      .finally(() => setCatalogLoading(false));
  }, []);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleAdd() {
    if (!selected.size) return;
    setLoading(true);
    try {
      await request('/provider-services/bulk', { serviceCatalogIds: [...selected] }, 'POST', token);
      onAdded();
    } catch (error) {
      setMessage(error.message || 'Unable to add services.');
      setLoading(false);
    }
  }

  const availableGroups = catalog.map((group) => ({
    ...group,
    services: group.services.filter((s) => !existingSet.has(s.id)),
  })).filter((g) => g.services.length > 0);

  if (catalogLoading) return <div className="catalog-browser"><p>Loading catalog…</p></div>;

  return (
    <div className="catalog-browser">
      <div className="catalog-browser-head">
        <h4>Add services from catalog</h4>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close">✕</button>
      </div>

      {availableGroups.length === 0 ? (
        <p>You have already added all available services.</p>
      ) : (
        availableGroups.map((group) => (
          <section key={group.category} className="service-catalog-group">
            <h5 className="service-catalog-category">{group.category}</h5>
            <div className="service-catalog-grid">
              {group.services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className={`service-catalog-card ${selected.has(service.id) ? 'service-catalog-card--selected' : ''}`}
                  onClick={() => toggle(service.id)}
                >
                  <strong>{service.name}</strong>
                  {service.description && <p>{service.description}</p>}
                  {selected.has(service.id) && <span className="service-catalog-check">✓</span>}
                </button>
              ))}
            </div>
          </section>
        ))
      )}

      {message ? <div className="status-banner">{message}</div> : null}

      {selected.size > 0 && (
        <button type="button" onClick={handleAdd} disabled={loading}>
          {loading ? 'Adding...' : `Add ${selected.size} service${selected.size > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}
