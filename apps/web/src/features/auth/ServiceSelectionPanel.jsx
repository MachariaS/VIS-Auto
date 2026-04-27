import { useEffect, useState } from 'react';
import { getApiUrl, request } from '../../shared/helpers';

const CATEGORY_ICONS = {
  'Roadside emergency': '🚨',
  'Mechanical & repairs': '🔧',
  'Engine & tuning': '⚙️',
  'Electrical & electronics': '⚡',
  'Suspension & alignment': '🎯',
  'Body & paint': '🎨',
  'Air conditioning': '❄️',
  'Cleaning & detailing': '✨',
  'Fuel & fluids': '⛽',
  'Vehicle inspection': '🔍',
  'Vehicle specialisation': '🏆',
};

export default function ServiceSelectionPanel({ token, user, onComplete }) {
  const [catalog, setCatalog] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  useEffect(() => {
    fetch(getApiUrl('/service-catalog'))
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCatalog(data);
          // Auto-expand first two categories
          setExpandedCategories(new Set(data.slice(0, 2).map((g) => g.category)));
        }
      })
      .catch(() => setMessage('Unable to load service catalog. Please try again.'))
      .finally(() => setCatalogLoading(false));
  }, []);

  function toggleService(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCategory(category) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  }

  function selectAll(services) {
    setSelected((prev) => {
      const next = new Set(prev);
      services.forEach((s) => next.add(s.id));
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
      await request('/provider-services/bulk', { serviceCatalogIds: [...selected] }, 'POST', token);
      onComplete();
    } catch (error) {
      setMessage(error.message || 'Unable to save services. Please try again.');
      setLoading(false);
    }
  }

  const totalServices = catalog.reduce((n, g) => n + g.services.length, 0);

  return (
    <div className="service-select-shell">
      <div className="service-select-head">
        <span className="mini-pill">Setup</span>
        <h2>What services do you offer?</h2>
        <p className="auth-copy">
          Select all services your business provides — you can always add or remove them later.
        </p>
        {selected.size > 0 && (
          <div className="service-select-count">
            ✓ {selected.size} service{selected.size !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {catalogLoading && (
        <div className="service-select-loading">Loading service catalog…</div>
      )}

      {!catalogLoading && catalog.length === 0 && (
        <div className="service-select-empty">
          <p>No catalog services available right now.</p>
          <p style={{ fontSize: 13, opacity: 0.7 }}>You can add custom services from your dashboard.</p>
        </div>
      )}

      <div className="service-select-catalog">
        {catalog.map((group) => {
          const isExpanded = expandedCategories.has(group.category);
          const groupSelected = group.services.filter((s) => selected.has(s.id)).length;

          return (
            <div key={group.category} className="service-select-group">
              <button
                type="button"
                className="service-select-group-head"
                onClick={() => toggleCategory(group.category)}
              >
                <span className="service-select-group-icon">
                  {CATEGORY_ICONS[group.category] ?? '🔧'}
                </span>
                <span className="service-select-group-name">{group.category}</span>
                {groupSelected > 0 && (
                  <span className="service-select-group-badge">{groupSelected}</span>
                )}
                <span className="service-select-group-chevron">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="service-select-group-body">
                  {group.services.length > 3 && groupSelected < group.services.length && (
                    <button
                      type="button"
                      className="link-button service-select-all"
                      onClick={() => selectAll(group.services)}
                    >
                      Select all in this category
                    </button>
                  )}
                  <div className="service-catalog-grid">
                    {group.services.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        className={`service-catalog-card ${selected.has(service.id) ? 'service-catalog-card--selected' : ''}`}
                        onClick={() => toggleService(service.id)}
                      >
                        {selected.has(service.id) && (
                          <span className="service-catalog-check">✓</span>
                        )}
                        <strong>{service.name}</strong>
                        {service.description && <p>{service.description}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {message && <div className="status-banner">{message}</div>}

      <div className="service-select-footer">
        <div className="service-select-summary">
          {selected.size === 0
            ? 'No services selected yet'
            : `${selected.size} of ${totalServices} services selected`}
        </div>
        <div className="service-select-footer-actions">
          <button className="ghost-button" type="button" onClick={onComplete}>
            Skip for now
          </button>
          <button
            className="primary-cta"
            type="button"
            onClick={handleConfirm}
            disabled={loading || selected.size === 0}
          >
            {loading ? 'Saving…' : `Add ${selected.size > 0 ? selected.size : ''} service${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
