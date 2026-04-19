import { initialProviderService, serviceTypeOptions } from '../../shared/constants';
import { formatCurrency, getServiceImageUrl } from '../../shared/helpers';

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

export default function ServicesPanel({
  providerServices,
  providerServiceForm,
  setProviderServiceForm,
  editingProviderServiceId,
  setEditingProviderServiceId,
  showProviderServiceComposer,
  setShowProviderServiceComposer,
  onSubmit,
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
        <button
          className="primary-cta"
          type="button"
          onClick={() => {
            setEditingProviderServiceId('');
            setProviderServiceForm(initialProviderService);
            setShowProviderServiceComposer((current) => !current);
          }}
        >
          {showProviderServiceComposer ? 'Hide form' : 'Add service'}
        </button>
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
          No services published yet. Click Add service to create your first service.
        </div>
      ) : (
        <div className="provider-manage-grid">
          {providerServices.map((service) => (
            <article className="provider-manage-card" key={service.id}>
              <div
                className="provider-manage-card-media"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.42)), url(${getServiceImageUrl(service)})`,
                }}
              >
                <span className="provider-manage-pill">
                  {serviceTypeOptions.find((option) => option.code === service.serviceCode)?.label}
                </span>
              </div>

              <div className="provider-manage-card-copy">
                <div className="provider-manage-card-head">
                  <strong>{service.serviceName}</strong>
                  <div className="provider-manage-prices">
                    <span>Base {formatCurrency(service.basePriceKsh)}</span>
                    <span>{formatCurrency(service.pricePerKmKsh)}/km</span>
                  </div>
                </div>

                <p>{service.description || 'No description yet.'}</p>

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
                      gasolineRegularPrice: service.fuelPricing?.gasoline?.regular
                        ? String(service.fuelPricing.gasoline.regular)
                        : '',
                      gasolineVPowerPrice: service.fuelPricing?.gasoline?.vpower
                        ? String(service.fuelPricing.gasoline.vpower)
                        : '',
                      dieselPrice: service.fuelPricing?.diesel?.standard
                        ? String(service.fuelPricing.diesel.standard)
                        : '',
                    });
                    setShowProviderServiceComposer(true);
                  }}
                >
                  Edit service
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
