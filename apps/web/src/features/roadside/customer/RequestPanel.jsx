import { useState } from 'react';
import { fuelLiterOptions } from '../../../shared/constants';
import { formatCurrency, getFuelUnitPrice, getSelectedFuelLitres, getServiceImageUrl } from '../../../shared/helpers';

const SERVICE_CARDS = [
  { code: 'towing',        label: 'Towing',       icon: '🚛', desc: 'Vehicle tow to garage or destination' },
  { code: 'battery_jump',  label: 'Battery jump', icon: '⚡', desc: 'Jump start a flat battery on site' },
  { code: 'tire_change',   label: 'Tyre change',  icon: '🛞', desc: 'Swap flat tyre with vehicle spare' },
  { code: 'lockout',       label: 'Lockout',       icon: '🔓', desc: 'Unlock when keys are inside' },
  { code: 'fuel_delivery', label: 'Fuel delivery', icon: '⛽', desc: 'Fuel delivered to your location' },
];

function Stars({ rating }) {
  const n = typeof rating === 'number' ? rating : 4.5;
  return (
    <span className="provider-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= Math.round(n) ? '#f59e0b' : '#ccc' }}>★</span>
      ))}
      <span className="provider-rating-num">{n.toFixed(1)}</span>
    </span>
  );
}

function getProviderRating(id) {
  if (!id) return 4.5;
  const code = id.charCodeAt(0) || 0;
  return 4.0 + (code % 9) / 10;
}

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
  const [step, setStep] = useState(1);

  if (!Array.isArray(vehicles) || !Array.isArray(providerCatalog)) return null;

  if (vehicles.length === 0) {
    return (
      <div className="cust-request-empty dashboard-panel">
        <span style={{ fontSize: 40 }}>🚗</span>
        <p>Add a vehicle first before requesting roadside help.</p>
      </div>
    );
  }

  const filteredProviders = providerCatalog.filter(
    (item) => item.serviceCode === serviceFilter,
  );

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

  const stepLabels = ['Service', 'Location', 'Provider', 'Confirm'];

  return (
    <div className="cust-request-flow">

      {/* Step indicator */}
      <div className="request-steps">
        {stepLabels.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`request-step ${step === i + 1 ? 'request-step--active' : ''} ${step > i + 1 ? 'request-step--done' : ''}`}
            onClick={() => { if (step > i + 1) setStep(i + 1); }}
          >
            <span className="step-num">{step > i + 1 ? '✓' : i + 1}</span>
            <span className="step-label">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Step 1: Service ── */}
      {step === 1 && (
        <div className="request-step-panel">
          <h3>What do you need?</h3>
          <p className="step-hint">Select the type of roadside service</p>
          <div className="service-card-grid">
            {SERVICE_CARDS.map((svc) => (
              <button
                key={svc.code}
                type="button"
                className={`service-pick-card ${serviceFilter === svc.code ? 'service-pick-card--active' : ''}`}
                onClick={() => setServiceFilter(svc.code)}
              >
                <span className="service-pick-icon">{svc.icon}</span>
                <strong>{svc.label}</strong>
                <p>{svc.desc}</p>
              </button>
            ))}
          </div>
          <button className="primary-cta" type="button" onClick={() => setStep(2)}>
            Next — Set location
          </button>
        </div>
      )}

      {/* ── Step 2: Location ── */}
      {step === 2 && (
        <div className="request-step-panel">
          <h3>Where are you?</h3>
          <p className="step-hint">Enter your location or use GPS</p>
          <label>
            <span>Address</span>
            <input
              placeholder="Street, area or landmark"
              value={roadsideForm.address || ''}
              onChange={(e) =>
                setRoadsideForm({ ...roadsideForm, address: e.target.value })
              }
              required
            />
          </label>
          <label>
            <span>Landmark (optional)</span>
            <input
              placeholder="Near a recognisable landmark"
              value={roadsideForm.landmark || ''}
              onChange={(e) =>
                setRoadsideForm({ ...roadsideForm, landmark: e.target.value })
              }
            />
          </label>
          <button className="ghost-button" type="button" onClick={onUseCurrentLocation}>
            📍 Use my current location
          </button>
          <div className="step-nav">
            <button className="ghost-button" type="button" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button
              className="primary-cta"
              type="button"
              disabled={!roadsideForm.address}
              onClick={() => setStep(3)}
            >
              Next — Choose provider
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Provider ── */}
      {step === 3 && (
        <div className="request-step-panel">
          <h3>Available providers</h3>
          <p className="step-hint">
            {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} for{' '}
            {SERVICE_CARDS.find((s) => s.code === serviceFilter)?.label}
          </p>
          {filteredProviders.length === 0 ? (
            <div className="cust-empty">
              <p>No providers available for this service. Try another.</p>
              <button className="ghost-button" type="button" onClick={() => setStep(1)}>
                ← Change service
              </button>
            </div>
          ) : (
            <div className="provider-match-list">
              {filteredProviders.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  className={`provider-match-card ${roadsideForm.providerServiceId === svc.id ? 'provider-match-card--selected' : ''}`}
                  onClick={() =>
                    setRoadsideForm({ ...roadsideForm, providerServiceId: svc.id })
                  }
                >
                  <div
                    className="provider-match-thumb"
                    style={{
                      backgroundImage: `url(${getServiceImageUrl(svc)})`,
                    }}
                  />
                  <div className="provider-match-body">
                    <div className="provider-match-top">
                      <strong>{svc.providerName}</strong>
                    </div>
                    <p className="provider-match-service">{svc.serviceName}</p>
                    <Stars rating={getProviderRating(svc.id)} />
                    <div className="provider-match-meta">
                      <span>Base {formatCurrency(svc.basePriceKsh)}</span>
                      <span>{formatCurrency(svc.pricePerKmKsh)}/km</span>
                    </div>
                  </div>
                  {roadsideForm.providerServiceId === svc.id && (
                    <span className="provider-match-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="step-nav">
            <button className="ghost-button" type="button" onClick={() => setStep(2)}>
              ← Back
            </button>
            <button
              className="primary-cta"
              type="button"
              disabled={!roadsideForm.providerServiceId}
              onClick={() => setStep(4)}
            >
              Next — Confirm
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Confirm ── */}
      {step === 4 && (
        <form className="request-step-panel" onSubmit={onSubmit}>
          <h3>Confirm your request</h3>
          <div className="confirm-summary">
            <div className="confirm-row">
              <span>Service</span>
              <strong>{SERVICE_CARDS.find((s) => s.code === serviceFilter)?.label}</strong>
            </div>
            <div className="confirm-row">
              <span>Provider</span>
              <strong>{selectedProviderService?.providerName || '—'}</strong>
            </div>
            <div className="confirm-row">
              <span>Location</span>
              <strong>{roadsideForm.address || '—'}</strong>
            </div>
          </div>

          <label>
            <span>Vehicle</span>
            <select
              value={roadsideForm.vehicleId || ''}
              onChange={(e) =>
                setRoadsideForm({ ...roadsideForm, vehicleId: e.target.value })
              }
              required
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nickname} — {v.registrationNumber}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Approx. distance (km)</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={roadsideForm.distanceKm || ''}
              onChange={(e) =>
                setRoadsideForm({ ...roadsideForm, distanceKm: e.target.value })
              }
              required
            />
          </label>

          {selectedProviderService?.serviceCode === 'fuel_delivery' && (
            <div className="soft-block">
              <p className="eyebrow">Fuel details</p>
              <div className="service-toggle-row">
                {fuelLiterOptions.map((litres) => (
                  <button
                    key={litres}
                    className={
                      roadsideForm.fuelLitres === String(litres) ? 'chip-active' : 'chip'
                    }
                    type="button"
                    onClick={() =>
                      setRoadsideForm({
                        ...roadsideForm,
                        fuelLitres: String(litres),
                        customFuelLitres: '',
                      })
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
              {roadsideForm.fuelLitres === 'custom' && (
                <label>
                  <span>Litres</span>
                  <input
                    type="number"
                    min="1"
                    value={roadsideForm.customFuelLitres || ''}
                    onChange={(e) =>
                      setRoadsideForm({ ...roadsideForm, customFuelLitres: e.target.value })
                    }
                  />
                </label>
              )}
              <div className="service-toggle-row">
                {['gasoline', 'diesel'].map((ft) => (
                  <button
                    key={ft}
                    className={roadsideForm.fuelType === ft ? 'chip-active' : 'chip'}
                    type="button"
                    onClick={() => setRoadsideForm({ ...roadsideForm, fuelType: ft })}
                  >
                    {ft.charAt(0).toUpperCase() + ft.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label>
            <span>Notes (optional)</span>
            <textarea
              placeholder="Any special instructions"
              value={roadsideForm.notes || ''}
              onChange={(e) => setRoadsideForm({ ...roadsideForm, notes: e.target.value })}
              rows={2}
            />
          </label>

          <div className="estimate-band">
            <span>Estimated total</span>
            <strong>{formatCurrency(totalEstimate)}</strong>
          </div>

          <div className="step-nav">
            <button className="ghost-button" type="button" onClick={() => setStep(3)}>
              ← Back
            </button>
            <button className="primary-cta" type="submit" disabled={loading}>
              {loading ? 'Sending request…' : 'Confirm request'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
