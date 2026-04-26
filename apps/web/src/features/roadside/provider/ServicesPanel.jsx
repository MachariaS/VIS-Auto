import { CATEGORY_BY_CODE, initialProviderService, SERVICE_CATEGORY_ORDER, serviceTypeOptions } from '../../../shared/constants';
import { formatCurrency, getServiceImageUrl } from '../../../shared/helpers';

const SERVICE_ICON = {
  towing: '🚛', battery_jump_start: '⚡', tyre_change: '🛞', lockout_assistance: '🔓',
  fuel_delivery: '⛽', winching: '⛓️', fuel_petrol_regular: '⛽', fuel_petrol_premium: '⛽',
  fuel_diesel: '🛢️', fluid_top_up: '💧', on_site_diagnosis: '🔍', oil_change: '🛢️',
  minor_repairs: '🔧', tyre_fitting: '🛞', brake_pad_replacement: '🛑',
  brake_disc_replacement: '🛑', brake_fluid_flush: '💧', clutch_replacement: '⚙️',
  gearbox_service: '⚙️', cv_joint_replacement: '⚙️', timing_belt_service: '⏱️',
  radiator_service: '🌡️', full_engine_service: '🔩', ecu_remap: '💻',
  turbo_service: '🌀', exhaust_service: '💨', air_intake_service: '💨',
  engine_rebuild: '🔩', electrical_diagnosis: '⚡', battery_replacement: '🔋',
  alternator_repair: '⚡', car_audio_install: '🎵', camera_alarm_install: '📷',
  lighting_upgrade: '💡', dent_repair: '🔨', scratch_repair: '🎨', panel_beating: '🔨',
  full_respray: '🎨', windscreen_service: '🪟', rust_treatment: '🛡️',
  wheel_alignment: '🎯', wheel_balancing: '⚖️', shock_absorber_service: '🔩',
  suspension_service: '🔧', rim_repair: '⭕', ac_regas: '❄️', ac_repair: '❄️',
  cabin_filter_replacement: '🌬️', car_wash_exterior: '🚿', car_wash_full: '🚿',
  detailing: '✨', engine_bay_clean: '🧹', ceramic_coating: '💎', ppf_wrap: '🛡️',
  pre_purchase_inspection: '🔍', roadworthy_inspection: '✅', insurance_inspection: '📋',
};

function ServiceComposer({
  providerServiceForm,
  setProviderServiceForm,
  editingProviderServiceId,
  setEditingProviderServiceId,
  setShowProviderServiceComposer,
  onSubmit,
  loading,
  message,
}) {
  const isFuelDelivery = providerServiceForm.serviceCode === 'fuel_delivery';

  return (
    <form className="dashboard-panel stack" onSubmit={onSubmit}>
      <div className="panel-head">
        <div>
          <p className="eyebrow">Service pricing</p>
          <h3>{editingProviderServiceId ? 'Edit service' : 'Add service'}</h3>
        </div>
      </div>

      {message ? <div className="status-banner">{message}</div> : null}

      <div className="form-grid">
        <label>
          <span>Name</span>
          <input
            value={providerServiceForm.serviceName}
            onChange={(event) =>
              setProviderServiceForm({ ...providerServiceForm, serviceName: event.target.value })
            }
          />
        </label>
        <label>
          <span>Type</span>
          <select
            value={providerServiceForm.serviceCode}
            onChange={(event) =>
              setProviderServiceForm({ ...providerServiceForm, serviceCode: event.target.value })
            }
          >
            {serviceTypeOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Base charge</span>
          <input
            type="number"
            min="0"
            value={providerServiceForm.basePriceKsh}
            onChange={(event) =>
              setProviderServiceForm({ ...providerServiceForm, basePriceKsh: event.target.value })
            }
          />
        </label>
        <label>
          <span>Charge per km</span>
          <input
            type="number"
            min="0"
            value={providerServiceForm.pricePerKmKsh}
            onChange={(event) =>
              setProviderServiceForm({ ...providerServiceForm, pricePerKmKsh: event.target.value })
            }
          />
        </label>
      </div>
      <label>
        <span>Description</span>
        <textarea
          value={providerServiceForm.description}
          onChange={(event) =>
            setProviderServiceForm({ ...providerServiceForm, description: event.target.value })
          }
        />
      </label>

      {isFuelDelivery ? (
        <div className="soft-block">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">Fuel</p>
              <h3>Per litre pricing</h3>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>Gasoline regular</span>
              <input
                type="number"
                min="0"
                value={providerServiceForm.gasolineRegularPrice}
                onChange={(event) =>
                  setProviderServiceForm({
                    ...providerServiceForm,
                    gasolineRegularPrice: event.target.value,
                  })
                }
              />
            </label>
            <label>
              <span>Gasoline V-Power</span>
              <input
                type="number"
                min="0"
                value={providerServiceForm.gasolineVPowerPrice}
                onChange={(event) =>
                  setProviderServiceForm({
                    ...providerServiceForm,
                    gasolineVPowerPrice: event.target.value,
                  })
                }
              />
            </label>
            <label>
              <span>Diesel</span>
              <input
                type="number"
                min="0"
                value={providerServiceForm.dieselPrice}
                onChange={(event) =>
                  setProviderServiceForm({
                    ...providerServiceForm,
                    dieselPrice: event.target.value,
                  })
                }
              />
            </label>
          </div>
        </div>
      ) : null}

      <div className="form-grid">
        <label>
          <span>Visibility</span>
          <select
            value={providerServiceForm.visibility ?? 'public'}
            onChange={(e) => setProviderServiceForm({ ...providerServiceForm, visibility: e.target.value })}
          >
            <option value="public">Public — visible to customers</option>
            <option value="estimation_only">Estimation only — used for price estimates</option>
            <option value="private">Private — hidden from search</option>
          </select>
        </label>
        <label>
          <span>Max radius (km)</span>
          <input
            type="number"
            min="0"
            placeholder="e.g. 20"
            value={providerServiceForm.maxRadiusKm ?? ''}
            onChange={(e) => setProviderServiceForm({ ...providerServiceForm, maxRadiusKm: e.target.value })}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={providerServiceForm.useForEstimation ?? true}
            onChange={(e) => setProviderServiceForm({ ...providerServiceForm, useForEstimation: e.target.checked })}
          />
          <span>Use this rate card for customer price estimates</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={providerServiceForm.isAcceptingJobs ?? true}
            onChange={(e) => setProviderServiceForm({ ...providerServiceForm, isAcceptingJobs: e.target.checked })}
          />
          <span>Accepting jobs for this service</span>
        </label>
      </div>

      <div className="form-actions">
        <button className="primary-cta service-submit-button" type="submit" disabled={loading}>
          {loading ? 'Saving...' : editingProviderServiceId ? 'Update service' : 'Publish service'}
        </button>
        {editingProviderServiceId ? (
          <button
            className="ghost-button service-cancel-button"
            type="button"
            onClick={() => {
              setEditingProviderServiceId('');
              setProviderServiceForm(initialProviderService);
              setShowProviderServiceComposer(false);
            }}
          >
            Cancel edit
          </button>
        ) : null}
      </div>
    </form>
  );
}

function ServiceCard({ service, setEditingProviderServiceId, setProviderServiceForm, setShowProviderServiceComposer, onDelete }) {
  return (
    <article className="provider-manage-card">
      <div className="provider-manage-card-thumb">
        {SERVICE_ICON[service.serviceCode] ? (
          <div className="provider-manage-card-icon">{SERVICE_ICON[service.serviceCode]}</div>
        ) : (
          <img src={getServiceImageUrl(service)} alt={service.serviceName} className="provider-manage-card-img" />
        )}
      </div>
      <div className="provider-manage-card-body">
        <div className="provider-manage-card-head">
          <strong>{service.serviceName}</strong>
          <div className="provider-manage-prices">
            <span>{formatCurrency(service.basePriceKsh)}</span>
            <span className="price-dim">{formatCurrency(service.pricePerKmKsh)}/km</span>
          </div>
        </div>
        <div className="service-card-badges">
          <span className={`visibility-badge visibility-badge--${service.visibility ?? 'public'}`}>
            {service.visibility === 'estimation_only' ? 'Estimation only' : service.visibility === 'private' ? 'Private' : 'Public'}
          </span>
          <span className={`availability-badge ${service.isAcceptingJobs !== false ? 'availability-badge--open' : 'availability-badge--closed'}`}>
            {service.isAcceptingJobs !== false ? 'Accepting jobs' : 'Not accepting'}
          </span>
        </div>
        {service.description ? <p className="provider-manage-card-desc">{service.description}</p> : null}
        <div className="provider-manage-card-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              setEditingProviderServiceId(service.id);
              setProviderServiceForm({
                serviceName: service.serviceName,
                serviceCode: service.serviceCode,
                basePriceKsh: String(service.basePriceKsh),
                pricePerKmKsh: String(service.pricePerKmKsh),
                description: service.description ?? '',
                gasolineRegularPrice: service.fuelPricing?.gasoline?.regular ? String(service.fuelPricing.gasoline.regular) : '',
                gasolineVPowerPrice: service.fuelPricing?.gasoline?.vpower ? String(service.fuelPricing.gasoline.vpower) : '',
                dieselPrice: service.fuelPricing?.diesel?.standard ? String(service.fuelPricing.diesel.standard) : '',
              });
              setShowProviderServiceComposer(true);
            }}
          >
            Edit
          </button>
          <button
            className="ghost-button danger"
            type="button"
            onClick={() => {
              if (window.confirm(`Remove "${service.serviceName}"? This cannot be undone.`)) {
                onDelete(service.id);
              }
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

function GroupedServiceCards({ providerServices, setEditingProviderServiceId, setProviderServiceForm, setShowProviderServiceComposer, onDelete }) {
  const grouped = SERVICE_CATEGORY_ORDER.reduce((acc, cat) => {
    const services = providerServices.filter((s) => (CATEGORY_BY_CODE[s.serviceCode] ?? 'Other') === cat);
    if (services.length) acc.push({ category: cat, services });
    return acc;
  }, []);

  const uncategorised = providerServices.filter(
    (s) => !CATEGORY_BY_CODE[s.serviceCode] && !SERVICE_CATEGORY_ORDER.includes(s.serviceCode),
  );
  if (uncategorised.length) grouped.push({ category: 'Other', services: uncategorised });

  return (
    <div className="provider-manage-sections">
      {grouped.map(({ category, services }) => (
        <section key={category} className="provider-manage-section">
          <h4 className="provider-manage-section-label">{category}</h4>
          <div className="provider-manage-grid">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                setEditingProviderServiceId={setEditingProviderServiceId}
                setProviderServiceForm={setProviderServiceForm}
                setShowProviderServiceComposer={setShowProviderServiceComposer}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function ServicesPanel({
  providerServices,
  providerServiceForm,
  setProviderServiceForm,
  editingProviderServiceId,
  setEditingProviderServiceId,
  showProviderServiceComposer,
  setShowProviderServiceComposer,
  onSubmit,
  onDelete,
  onOpenCatalog,
  loading,
  message,
}) {
  return (
    <section className="dashboard-panel stack">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Published</p>
          <h3>Service catalog</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onOpenCatalog && (
            <button className="ghost-button" type="button" onClick={onOpenCatalog}>
              Add from catalog
            </button>
          )}
          <button
            className="primary-cta"
            type="button"
            onClick={() => {
              setEditingProviderServiceId('');
              setProviderServiceForm(initialProviderService);
              setShowProviderServiceComposer((current) => !current);
            }}
          >
            {showProviderServiceComposer ? 'Hide form' : 'Custom service'}
          </button>
        </div>
      </div>

      {showProviderServiceComposer ? (
        <div className="provider-service-composer">
          <ServiceComposer
            providerServiceForm={providerServiceForm}
            setProviderServiceForm={setProviderServiceForm}
            editingProviderServiceId={editingProviderServiceId}
            setEditingProviderServiceId={setEditingProviderServiceId}
            setShowProviderServiceComposer={setShowProviderServiceComposer}
            onSubmit={onSubmit}
            loading={loading}
            message={message}
          />
        </div>
      ) : null}

      {providerServices.length === 0 ? (
        <div className="empty-state">
          No services published yet. Use Add from catalog or Custom service to get started.
        </div>
      ) : (
        <GroupedServiceCards
          providerServices={providerServices}
          setEditingProviderServiceId={setEditingProviderServiceId}
          setProviderServiceForm={setProviderServiceForm}
          setShowProviderServiceComposer={setShowProviderServiceComposer}
          onDelete={onDelete}
        />
      )}
    </section>
  );
}
