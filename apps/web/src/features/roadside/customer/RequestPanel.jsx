import { fuelLiterOptions, serviceTypeOptions } from '../../../shared/constants';
import { formatCurrency, getFuelUnitPrice, getSelectedFuelLitres, getServiceImageUrl } from '../../../shared/helpers';

export default function RequestPanel({
  vehicles,
  providerCatalog,
  serviceFilter,
  setServiceFilter,
  roadsideForm,
  setRoadsideForm,
  onSubmit,
  onUseCurrentLocation,
  loading,
}) {
  const filteredProviderOptions = providerCatalog.filter(
    (item) => item.serviceCode === serviceFilter,
  );

  if (vehicles.length === 0) {
    return <div className="dashboard-panel empty-state">Add a vehicle first.</div>;
  }

  if (providerCatalog.length === 0) {
    return <div className="dashboard-panel empty-state">No provider services are live yet.</div>;
  }

  if (filteredProviderOptions.length === 0) {
    return (
      <div className="dashboard-panel empty-state">
        No providers currently offer{' '}
        {serviceTypeOptions.find((item) => item.code === serviceFilter)?.label.toLowerCase()}.
      </div>
    );
  }

  const selectedProviderService = providerCatalog.find(
    (item) => item.id === roadsideForm.providerServiceId,
  );
  const selectedFuelLitres = getSelectedFuelLitres(roadsideForm);
  const deliveryEstimate = selectedProviderService
    ? Number(roadsideForm.distanceKm || 0) * selectedProviderService.pricePerKmKsh +
      selectedProviderService.basePriceKsh
    : 0;
  const fuelEstimate =
    selectedProviderService?.serviceCode === 'fuel_delivery'
      ? getFuelUnitPrice(selectedProviderService, roadsideForm) * selectedFuelLitres
      : 0;
  const totalEstimate = deliveryEstimate + fuelEstimate;

  return (
    <form className="dashboard-panel stack" onSubmit={onSubmit}>
      <div className="panel-head">
        <div>
          <p className="eyebrow">Roadside request</p>
          <h3>Simple, fast request</h3>
        </div>
      </div>

      <div className="service-toggle-row">
        {serviceTypeOptions.map((option) => (
          <button
            key={option.code}
            className={serviceFilter === option.code ? 'chip-active' : 'chip'}
            type="button"
            onClick={() => setServiceFilter(option.code)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="form-grid">
        <label>
          <span>Vehicle</span>
          <select
            value={roadsideForm.vehicleId}
            onChange={(event) =>
              setRoadsideForm({ ...roadsideForm, vehicleId: event.target.value })
            }
          >
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.nickname} • {vehicle.registrationNumber}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Provider</span>
          <select
            value={roadsideForm.providerServiceId}
            onChange={(event) =>
              setRoadsideForm({ ...roadsideForm, providerServiceId: event.target.value })
            }
          >
            {filteredProviderOptions.map((service) => (
              <option key={service.id} value={service.id}>
                {service.providerName} • {service.serviceName}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Distance km</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={roadsideForm.distanceKm}
            onChange={(event) =>
              setRoadsideForm({ ...roadsideForm, distanceKm: event.target.value })
            }
          />
        </label>
        <label>
          <span>Address</span>
          <input
            value={roadsideForm.address}
            onChange={(event) =>
              setRoadsideForm({ ...roadsideForm, address: event.target.value })
            }
          />
        </label>
        <label>
          <span>Latitude</span>
          <input
            value={roadsideForm.latitude}
            onChange={(event) =>
              setRoadsideForm({ ...roadsideForm, latitude: event.target.value })
            }
          />
        </label>
        <label>
          <span>Longitude</span>
          <input
            value={roadsideForm.longitude}
            onChange={(event) =>
              setRoadsideForm({ ...roadsideForm, longitude: event.target.value })
            }
          />
        </label>
      </div>

      <section className="provider-option-grid">
        {filteredProviderOptions.map((service) => (
          <button
            key={service.id}
            type="button"
            className={
              roadsideForm.providerServiceId === service.id
                ? 'provider-option-card provider-option-card-active'
                : 'provider-option-card'
            }
            onClick={() => setRoadsideForm({ ...roadsideForm, providerServiceId: service.id })}
          >
            <div
              className="provider-option-media"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.06), rgba(15, 23, 42, 0.48)), url(${getServiceImageUrl(service)})`,
              }}
            >
              <span>
                {serviceTypeOptions.find((item) => item.code === service.serviceCode)?.label}
              </span>
            </div>
            <div className="provider-option-copy">
              <strong>{service.providerName}</strong>
              <p>{service.serviceName}</p>
              <div className="provider-option-price">
                <span>{formatCurrency(service.basePriceKsh)}</span>
                <span>{formatCurrency(service.pricePerKmKsh)}/km</span>
              </div>
            </div>
          </button>
        ))}
      </section>

      <button className="ghost-button" type="button" onClick={onUseCurrentLocation}>
        Use current location
      </button>

      {selectedProviderService?.serviceCode === 'fuel_delivery' ? (
        <div className="soft-block">
          <div className="service-toggle-row">
            {fuelLiterOptions.map((litres) => (
              <button
                key={litres}
                className={roadsideForm.fuelLitres === String(litres) ? 'chip-active' : 'chip'}
                type="button"
                onClick={() =>
                  setRoadsideForm({ ...roadsideForm, fuelLitres: String(litres), customFuelLitres: '' })
                }
              >
                {litres}L
              </button>
            ))}
            <button
              className={roadsideForm.fuelLitres === 'custom' ? 'chip-active' : 'chip'}
              type="button"
              onClick={() => setRoadsideForm({ ...roadsideForm, fuelLitres: 'custom' })}
            >
              Custom
            </button>
          </div>

          {roadsideForm.fuelLitres === 'custom' ? (
            <label>
              <span>Custom litres</span>
              <input
                type="number"
                min="1"
                value={roadsideForm.customFuelLitres}
                onChange={(event) =>
                  setRoadsideForm({ ...roadsideForm, customFuelLitres: event.target.value })
                }
              />
            </label>
          ) : null}

          <div className="form-grid">
            <label>
              <span>Fuel type</span>
              <select
                value={roadsideForm.fuelType}
                onChange={(event) =>
                  setRoadsideForm({ ...roadsideForm, fuelType: event.target.value })
                }
              >
                <option value="gasoline">Gasoline</option>
                <option value="diesel">Diesel</option>
              </select>
            </label>
            {roadsideForm.fuelType === 'gasoline' ? (
              <label>
                <span>Grade</span>
                <select
                  value={roadsideForm.gasolineGrade}
                  onChange={(event) =>
                    setRoadsideForm({ ...roadsideForm, gasolineGrade: event.target.value })
                  }
                >
                  <option value="regular">Regular</option>
                  <option value="vpower">V-Power</option>
                </select>
              </label>
            ) : null}
          </div>
        </div>
      ) : null}

      <label>
        <span>Landmark</span>
        <input
          value={roadsideForm.landmark}
          onChange={(event) =>
            setRoadsideForm({ ...roadsideForm, landmark: event.target.value })
          }
        />
      </label>
      <label>
        <span>Notes</span>
        <textarea
          value={roadsideForm.notes}
          onChange={(event) => setRoadsideForm({ ...roadsideForm, notes: event.target.value })}
        />
      </label>

      <div className="estimate-band">
        <span>Estimated total</span>
        <strong>{formatCurrency(totalEstimate || deliveryEstimate)}</strong>
        <p>
          {selectedProviderService?.serviceCode === 'fuel_delivery'
            ? `Fuel ${formatCurrency(fuelEstimate)} + delivery ${formatCurrency(deliveryEstimate)}`
            : `Base ${formatCurrency(selectedProviderService?.basePriceKsh)} + ${formatCurrency(selectedProviderService?.pricePerKmKsh)}/km`}
        </p>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit request'}
      </button>
    </form>
  );
}
