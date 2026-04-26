import { useEffect, useRef, useState, useCallback } from 'react';
import { fuelLiterOptions } from '../../../shared/constants';
import { formatCurrency, getFuelUnitPrice, getSelectedFuelLitres, getServiceImageUrl } from '../../../shared/helpers';

async function suggestLocations(query) {
  if (!query || query.length < 3) return [];
  try {
    const params = new URLSearchParams({
      q: query, format: 'jsonv2', addressdetails: '1', limit: '6',
      countrycodes: 'ke,ug,tz,rw,bi,et',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
    const data = await res.json();
    return Array.isArray(data)
      ? data.map((item) => ({
          display: item.display_name,
          short: item.display_name.split(',').slice(0, 3).join(', '),
          lat: item.lat,
          lng: item.lon,
          landmark: item.address?.amenity || item.address?.building || item.address?.shop || item.address?.road || '',
        }))
      : [];
  } catch { return []; }
}

function AddressSearch({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onPointerDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function handleChange(val) {
    onChange(val);
    clearTimeout(timerRef.current);
    if (val.length < 3) { setSuggestions([]); setOpen(false); return; }
    setBusy(true);
    timerRef.current = setTimeout(async () => {
      const results = await suggestLocations(val);
      setSuggestions(results);
      setOpen(results.length > 0);
      setBusy(false);
    }, 420);
  }

  function pick(s) {
    onSelect(s);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="address-search-wrap" ref={wrapRef}>
      <div className="address-search-input-row">
        <input
          placeholder="Street, area or landmark"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          autoComplete="off"
          required
        />
        {busy && <span className="address-search-spinner">⟳</span>}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="address-suggestions">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button type="button" onClick={() => pick(s)}>
                <strong>{s.short.split(',')[0]}</strong>
                <span>{s.short.split(',').slice(1).join(',').trim()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Codes must match the backend service catalog codes exactly
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

const SERVICE_CARDS = [
  { code: 'towing',               label: 'Towing',          icon: '🚛', desc: 'Vehicle tow to garage or destination' },
  { code: 'battery_jump_start',   label: 'Battery jump',    icon: '⚡', desc: 'Jump start a flat battery on site' },
  { code: 'tyre_change',          label: 'Tyre change',     icon: '🛞', desc: 'Swap flat tyre with vehicle spare' },
  { code: 'lockout_assistance',   label: 'Lockout',         icon: '🔓', desc: 'Unlock when keys are inside' },
  { code: 'fuel_delivery',        label: 'Fuel delivery',   icon: '⛽', desc: 'Fuel delivered to your location' },
  { code: 'on_site_diagnosis',    label: 'Diagnosis',       icon: '🔍', desc: 'OBD scan and fault code reading' },
  { code: 'winching',             label: 'Winching',        icon: '⛓️', desc: 'Pull from ditch, mud or off-road' },
];

function Stars({ rating, count }) {
  const n = typeof rating === 'number' ? rating : 0;
  return (
    <span className="provider-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= Math.round(n) ? '#f59e0b' : 'var(--border-soft)' }}>★</span>
      ))}
      <span className="provider-rating-num">{n.toFixed(1)}</span>
      {count > 0 && <span className="provider-rating-count">({count})</span>}
    </span>
  );
}

const ratingCache = {};

function useProviderRating(providerId) {
  const [data, setData] = useState(ratingCache[providerId] ?? null);
  useEffect(() => {
    if (!providerId || ratingCache[providerId] !== undefined) return;
    fetch(`/providers/${providerId}/ratings`)
      .then((r) => r.json())
      .then((d) => { ratingCache[providerId] = d; setData(d); })
      .catch(() => { ratingCache[providerId] = null; });
  }, [providerId]);
  return data;
}

function ProviderMatchCard({ svc, selected, onSelect }) {
  const ratings = useProviderRating(svc.providerId);
  const avg = ratings?.average ?? null;
  const count = ratings?.count ?? 0;
  return (
    <button
      type="button"
      className={`provider-match-card ${selected ? 'provider-match-card--selected' : ''}`}
      onClick={onSelect}
    >
      <div className="provider-match-thumb" style={{ backgroundImage: `url(${getServiceImageUrl(svc)})` }} />
      <div className="provider-match-body">
        <div className="provider-match-top">
          <strong>{svc.providerName}</strong>
        </div>
        <p className="provider-match-service">{svc.serviceName}</p>
        {avg !== null ? (
          <Stars rating={avg} count={count} />
        ) : (
          <span className="provider-no-rating">New provider</span>
        )}
        <div className="provider-match-meta">
          <span>Base {formatCurrency(svc.basePriceKsh)}</span>
          <span>{formatCurrency(svc.pricePerKmKsh)}/km</span>
        </div>
      </div>
      {selected && <span className="provider-match-check">✓</span>}
    </button>
  );
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
    (item) => (item.catalogCode || item.serviceCode) === serviceFilter,
  );

  const selectedProviderService = providerCatalog.find(
    (item) => item.id === roadsideForm.providerServiceId,
  );

  const isFuelDelivery =
    selectedProviderService?.catalogCode === 'fuel_delivery' ||
    selectedProviderService?.serviceCode === 'fuel_delivery';

  const selectedFuelLitres = getSelectedFuelLitres(roadsideForm);
  const deliveryEstimate = selectedProviderService
    ? Number(roadsideForm.distanceKm || 0) * selectedProviderService.pricePerKmKsh +
      selectedProviderService.basePriceKsh
    : 0;
  const fuelEstimate = isFuelDelivery
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
            <AddressSearch
              value={roadsideForm.address || ''}
              onChange={(val) => setRoadsideForm({ ...roadsideForm, address: val })}
              onSelect={(s) =>
                setRoadsideForm({
                  ...roadsideForm,
                  address: s.short,
                  landmark: s.landmark || roadsideForm.landmark || '',
                  latitude: s.lat,
                  longitude: s.lng,
                })
              }
            />
          </label>
          <label>
            <span>Landmark (optional — auto-filled, tap to edit)</span>
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
              <span style={{ fontSize: 32 }}>😴</span>
              <p><strong>No providers currently online</strong></p>
              <p style={{ fontSize: 13 }}>All providers for this service are offline right now. Try a different service or check back shortly.</p>
              <button className="ghost-button" type="button" onClick={() => setStep(1)}>
                ← Change service
              </button>
            </div>
          ) : (
            <div className="provider-match-list">
              {filteredProviders.map((svc) => (
                <ProviderMatchCard
                  key={svc.id}
                  svc={svc}
                  selected={roadsideForm.providerServiceId === svc.id}
                  onSelect={() => {
                    const cLat = Number(roadsideForm.latitude);
                    const cLng = Number(roadsideForm.longitude);
                    const autoKm =
                      cLat && cLng
                        ? Math.max(1, haversineKm(cLat, cLng, -1.2921, 36.8219)).toFixed(1)
                        : roadsideForm.distanceKm || '5';
                    setRoadsideForm({
                      ...roadsideForm,
                      providerServiceId: svc.id,
                      distanceKm: String(autoKm),
                    });
                  }}
                />
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
            <span>Distance to provider (km) — auto-estimated, tap to correct</span>
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

          {isFuelDelivery && (
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
