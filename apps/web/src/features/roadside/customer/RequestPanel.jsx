import { useEffect, useRef, useState, useCallback } from 'react';
import { fuelLiterOptions } from '../../../shared/constants';
import { formatCurrency, getFuelUnitPrice, getSelectedFuelLitres, getServiceImageUrl, getApiUrl, request } from '../../../shared/helpers';
import ProviderProfileCard from '../shared/ProviderProfileCard';
import { useApp } from '../../../context/AppContext';

async function suggestLocations(query, nearLat, nearLng) {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(getApiUrl('/locations/suggest'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, nearLat: nearLat || null, nearLng: nearLng || null, countryCode: 'KE' }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data)
      ? data.map((item) => ({
          display: item.address || item.name,
          short: [item.name, item.town].filter(Boolean).slice(0, 2).join(', ') || item.address,
          lat: item.lat,
          lng: item.lng,
          landmark: item.landmark || item.road || '',
        }))
      : [];
  } catch { return []; }
}

function AddressSearch({ value, onChange, onSelect, nearLat, nearLng }) {
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
      const results = await suggestLocations(val, nearLat, nearLng);
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

// Fallback icons for catalog codes not in the icon map
const CATALOG_ICONS = {
  towing:'🚛', battery_jump_start:'⚡', tyre_change:'🛞', lockout_assistance:'🔓',
  fuel_delivery:'⛽', winching:'⛓️', on_site_diagnosis:'🔍', oil_change:'🛢️',
  minor_repairs:'🔧', tyre_fitting:'🛞', brake_pad_replacement:'🛑',
  full_engine_service:'🔩', ecu_remap:'💻', turbo_service:'🌀',
  electrical_diagnosis:'⚡', battery_replacement:'🔋', car_audio_install:'🎵',
  dent_repair:'🔨', scratch_repair:'🎨', full_respray:'🎨', panel_beating:'🔨',
  wheel_alignment:'🎯', wheel_balancing:'⚖️', suspension_service:'🔧',
  ac_regas:'❄️', ac_repair:'❄️', car_wash_exterior:'🚿', car_wash_full:'🚿',
  detailing:'✨', ceramic_coating:'💎', pre_purchase_inspection:'🔍',
  roadworthy_inspection:'✅',
};

function buildServiceCards(catalog) {
  const seen = new Set();
  return catalog
    .filter((p) => p.isAcceptingJobs && p.visibility === 'public')
    // Vehicle specialisation codes are provider matching signals — not customer-facing services
    .filter((p) => p.serviceCategory !== 'Vehicle specialisation')
    .filter((p) => {
      const code = p.catalogCode || p.serviceCode;
      if (!code || seen.has(code)) return false;
      seen.add(code);
      return true;
    })
    .map((p) => ({
      code: p.catalogCode || p.serviceCode,
      label: p.serviceName,
      icon: CATALOG_ICONS[p.catalogCode || p.serviceCode] || '🔧',
      desc: p.serviceCategory || '',
      category: p.serviceCategory || 'Other',
    }));
}

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

const BADGE_COLORS = {
  'Top rated':        { bg: 'rgba(234,179,8,0.15)',   color: '#ca8a04' },
  'Served you before':{ bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
  default:            { bg: 'rgba(132,204,22,0.15)',  color: '#84cc16' },
};

function MatchBadge({ label }) {
  const style = BADGE_COLORS[label] ?? BADGE_COLORS.default;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
      background: style.bg, color: style.color,
      letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function ProviderMatchCard({ svc, selected, onSelect }) {
  const avg = svc.avgRating ?? null;
  const count = svc.ratingCount ?? 0;
  const badges = svc.matchReasons ?? [];
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
        {badges.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
            {badges.map((b) => <MatchBadge key={b} label={b} />)}
          </div>
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

function ServicePickCard({ svc, selected, isFav, onSelect, onToggleFav }) {
  return (
    <div className={`service-pick-card-wrap ${selected ? 'service-pick-card-wrap--selected' : ''}`}>
      <button type="button" className={`service-pick-card ${selected ? 'service-pick-card--active' : ''}`} onClick={onSelect}>
        <span className="service-pick-icon">{svc.icon}</span>
        <strong>{svc.label}</strong>
        <p>{svc.desc || svc.category}</p>
      </button>
      <button
        type="button"
        className={`service-fav-btn ${isFav ? 'service-fav-btn--active' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        title={isFav ? 'Remove from favourites' : 'Add to favourites'}
      >
        {isFav ? '★' : '☆'}
      </button>
    </div>
  );
}

function SortedProviderList({ providers, roadsideForm, setRoadsideForm }) {
  const [viewingProfile, setViewingProfile] = useState(null);
  const cLat = Number(roadsideForm.latitude) || 0;
  const cLng = Number(roadsideForm.longitude) || 0;

  // Score = real avg rating (×2) + proximity bonus + price score
  const scored = providers.map((svc) => {
    const pLat = svc.providerBaseLat;
    const pLng = svc.providerBaseLng;
    const dist = cLat && cLng && pLat && pLng
      ? haversineKm(cLat, cLng, Number(pLat), Number(pLng))
      : 5;
    const ratingScore = (svc.avgRating ?? 0) * 2;
    const distScore = Math.max(0, 10 - dist);
    const priceScore = svc.basePriceKsh > 0 ? Math.max(0, 5 - svc.basePriceKsh / 1000) : 0;
    return { svc, score: ratingScore + distScore + priceScore, dist };
  });

  scored.sort((a, b) => b.score - a.score);

  function handleSelect(svc, dist) {
    // Prefer Haversine to provider's actual base location; fall back to rough estimate
    const pLat = svc.providerBaseLat;
    const pLng = svc.providerBaseLng;
    let autoKm = dist || 5;
    if (cLat && cLng && pLat && pLng) {
      autoKm = haversineKm(cLat, cLng, Number(pLat), Number(pLng));
    }
    setRoadsideForm({
      ...roadsideForm,
      providerServiceId: svc.id,
      distanceKm: String(Math.max(1, autoKm).toFixed(1)),
    });
  }

  return (
    <>
      {viewingProfile && (
        <ProviderProfileCard
          providerId={viewingProfile}
          onClose={() => setViewingProfile(null)}
        />
      )}
      <div className="provider-match-list">
        {scored.map(({ svc, score, dist }, idx) => (
          <div key={svc.id} style={{ position: 'relative' }}>
            {idx === 0 && <span className="provider-recommended-badge">⭐ Recommended</span>}
            <ProviderMatchCard
              svc={svc}
              selected={roadsideForm.providerServiceId === svc.id}
              onSelect={() => handleSelect(svc, dist)}
            />
            <button
              type="button"
              className="provider-view-profile-btn"
              onClick={() => setViewingProfile(svc.providerId)}
            >
              View profile
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default function RequestPanel({
  vehicles,
  providerCatalog,
  requests = [],
  profileSettings = {},
  handleProfileFieldChange,
  serviceFilter,
  setServiceFilter,
  roadsideForm,
  setRoadsideForm,
  onSubmit,
  onUseCurrentLocation,
  loading,
}) {
  const { token } = useApp();
  const [step, setStep] = useState(1);
  const [serviceSearch, setServiceSearch] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [dispatchMode, setDispatchMode] = useState('auto');
  const [dispatchPreview, setDispatchPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch dispatch preview when entering Step 4 in auto mode
  useEffect(() => {
    if (step !== 4 || dispatchMode !== 'auto' || !token) { setDispatchPreview(null); return; }
    if (!serviceFilter || !roadsideForm.latitude || !roadsideForm.longitude) return;

    setPreviewLoading(true);
    const params = new URLSearchParams({
      catalogCode: serviceFilter,
      lat: String(roadsideForm.latitude),
      lng: String(roadsideForm.longitude),
      ...(roadsideForm.vehicleId ? { vehicleId: roadsideForm.vehicleId } : {}),
    });
    request(`/roadside-requests/dispatch-preview?${params}`, undefined, 'GET', token)
      .then(setDispatchPreview)
      .catch(() => setDispatchPreview(null))
      .finally(() => setPreviewLoading(false));
  }, [step, dispatchMode, token, serviceFilter, roadsideForm.latitude, roadsideForm.longitude, roadsideForm.vehicleId]);

  // Keep roadsideForm in sync with dispatch mode
  useEffect(() => {
    if (dispatchMode === 'auto') {
      setRoadsideForm((f) => ({ ...f, catalogCode: serviceFilter, providerServiceId: '' }));
    } else {
      setRoadsideForm((f) => ({ ...f, catalogCode: '' }));
    }
  }, [dispatchMode, serviceFilter]);

  const prefs = profileSettings?.preferences ?? {};
  const enabledModules = prefs.serviceModules ?? null; // null = all enabled
  const favServiceCodes = prefs.favouriteServices ?? [];

  // Derive recent codes from completed requests (deduped, most recent first)
  const recentCodes = [...new Set(
    [...requests]
      .filter((r) => r.issueType)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((r) => r.catalogCode || r.serviceCode)
      .filter(Boolean)
  )].slice(0, 6);

  // All available service cards from live catalog, filtered by enabled modules
  const allServiceCards = buildServiceCards(providerCatalog).filter((s) => {
    if (!enabledModules) return true;
    return enabledModules[s.category] !== false;
  });

  // Favourites: cards the user has starred, available in catalog
  const favCards = favServiceCodes
    .map((code) => allServiceCards.find((s) => s.code === code))
    .filter(Boolean);

  // Recents: recently used codes, no duplicates with favs
  const recentCards = recentCodes
    .map((code) => allServiceCards.find((s) => s.code === code))
    .filter((s) => s && !favServiceCodes.includes(s.code));

  // Quick access = fav + recent, capped at 8 total
  const quickAccess = [...favCards, ...recentCards].slice(0, 8);

  // Search results across all cards
  const searchResults = serviceSearch.length >= 2
    ? allServiceCards.filter((s) =>
        s.label.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.desc.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.category.toLowerCase().includes(serviceSearch.toLowerCase())
      )
    : [];

  const activeCard = allServiceCards.find((s) => s.code === serviceFilter);

  function toggleFav(code) {
    const next = favServiceCodes.includes(code)
      ? favServiceCodes.filter((c) => c !== code)
      : [...favServiceCodes, code];
    if (handleProfileFieldChange) {
      handleProfileFieldChange('preferences', 'favouriteServices', next);
    }
  }

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

          {/* Search bar */}
          <div className="service-search-wrap">
            <span className="service-search-icon">🔍</span>
            <input
              className="service-search-input"
              placeholder="Search services…"
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              autoComplete="off"
            />
            {serviceSearch && (
              <button type="button" className="service-search-clear" onClick={() => setServiceSearch('')}>✕</button>
            )}
          </div>

          {/* Search results */}
          {serviceSearch.length >= 2 ? (
            <>
              <p className="step-hint">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{serviceSearch}"</p>
              {searchResults.length === 0 ? (
                <div className="cust-empty" style={{ padding: '20px 0' }}>
                  <p>No services found. Try a different keyword.</p>
                </div>
              ) : (
                <div className="service-card-grid">
                  {searchResults.map((svc) => (
                    <ServicePickCard key={svc.code} svc={svc} selected={serviceFilter === svc.code}
                      isFav={favServiceCodes.includes(svc.code)}
                      onSelect={() => { setServiceFilter(svc.code); setServiceSearch(''); }}
                      onToggleFav={() => toggleFav(svc.code)} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Quick access: favourites + recents */}
              {quickAccess.length > 0 ? (
                <>
                  <p className="step-hint">
                    {favCards.length > 0 && <span>⭐ Favourites &amp; </span>}Recent services
                  </p>
                  <div className="service-card-grid">
                    {quickAccess.map((svc) => (
                      <ServicePickCard key={svc.code} svc={svc} selected={serviceFilter === svc.code}
                        isFav={favServiceCodes.includes(svc.code)}
                        onSelect={() => setServiceFilter(svc.code)}
                        onToggleFav={() => toggleFav(svc.code)} />
                    ))}
                  </div>
                  <p className="step-hint" style={{ marginTop: 4 }}>
                    ↑ Search above to find any other service
                  </p>
                </>
              ) : (
                <>
                  <p className="step-hint">Available services</p>
                  <div className="service-card-grid">
                    {allServiceCards.slice(0, 8).map((svc) => (
                      <ServicePickCard key={svc.code} svc={svc} selected={serviceFilter === svc.code}
                        isFav={favServiceCodes.includes(svc.code)}
                        onSelect={() => setServiceFilter(svc.code)}
                        onToggleFav={() => toggleFav(svc.code)} />
                    ))}
                  </div>
                  {allServiceCards.length > 8 && (
                    <p className="step-hint">Search above to see all {allServiceCards.length} services</p>
                  )}
                </>
              )}
            </>
          )}

          <button className="primary-cta" type="button" disabled={!serviceFilter} onClick={() => setStep(2)}>
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
              nearLat={roadsideForm.latitude || null}
              nearLng={roadsideForm.longitude || null}
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
          <h3>Provider assignment</h3>
          <p className="step-hint" style={{ marginTop: -4 }}>Choose how you want to be matched with a provider</p>

          {filteredProviders.length === 0 ? (
            <div className="cust-empty">
              <span style={{ fontSize: 32 }}>😴</span>
              <p><strong>No providers currently online</strong></p>
              <p style={{ fontSize: 13 }}>All providers for this service are offline. Try a different service or check back shortly.</p>
              <button className="ghost-button" type="button" onClick={() => setStep(1)}>← Change service</button>
            </div>
          ) : (
            <>
              {/* Auto-dispatch card */}
              <button
                type="button"
                onClick={() => setDispatchMode('auto')}
                style={{
                  display: 'block', width: '100%', padding: '16px 18px',
                  borderRadius: '14px', marginBottom: '10px', cursor: 'pointer',
                  textAlign: 'left', border: `2px solid ${dispatchMode === 'auto' ? '#84cc16' : 'rgba(255,255,255,0.09)'}`,
                  background: dispatchMode === 'auto' ? 'rgba(132,204,22,0.07)' : 'rgba(255,255,255,0.03)',
                  transition: 'border-color .15s, background .15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(132,204,22,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>⚡</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 15, color: 'var(--text-primary, #f8fafc)' }}>Auto-dispatch</strong>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: 'rgba(132,204,22,0.18)', color: '#84cc16',
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}>Recommended</span>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${dispatchMode === 'auto' ? '#84cc16' : 'rgba(255,255,255,0.2)'}`,
                    background: dispatchMode === 'auto' ? '#84cc16' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, color: '#000', fontWeight: 700,
                    transition: 'all .15s',
                  }}>{dispatchMode === 'auto' ? '✓' : ''}</div>
                </div>
                <p style={{ margin: '10px 0 0 52px', fontSize: 13, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.55 }}>
                  We match you with the nearest available provider.{' '}
                  <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>
                    {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} online
                  </strong>{' '}
                  — typical response under 2 minutes.
                </p>
              </button>

              {/* Manual pick card */}
              <button
                type="button"
                onClick={() => setDispatchMode('manual')}
                style={{
                  display: 'block', width: '100%', padding: '16px 18px',
                  borderRadius: '14px', marginBottom: '10px', cursor: 'pointer',
                  textAlign: 'left', border: `2px solid ${dispatchMode === 'manual' ? '#84cc16' : 'rgba(255,255,255,0.09)'}`,
                  background: dispatchMode === 'manual' ? 'rgba(132,204,22,0.07)' : 'rgba(255,255,255,0.03)',
                  transition: 'border-color .15s, background .15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>🔍</div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 15, color: 'var(--text-primary, #f8fafc)' }}>Choose manually</strong>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${dispatchMode === 'manual' ? '#84cc16' : 'rgba(255,255,255,0.2)'}`,
                    background: dispatchMode === 'manual' ? '#84cc16' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, color: '#000', fontWeight: 700,
                    transition: 'all .15s',
                  }}>{dispatchMode === 'manual' ? '✓' : ''}</div>
                </div>
                <p style={{ margin: '10px 0 0 52px', fontSize: 13, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.55 }}>
                  Browse and pick a specific provider from the list.
                </p>
              </button>

              {/* Provider list — only in manual mode */}
              {dispatchMode === 'manual' && (
                <>
                  {filteredProviders.length > 1 && (
                    <div className="service-search-wrap">
                      <span className="service-search-icon">🔍</span>
                      <input
                        className="service-search-input"
                        placeholder="Search by provider name…"
                        value={providerSearch}
                        onChange={(e) => setProviderSearch(e.target.value)}
                      />
                      {providerSearch && (
                        <button type="button" className="service-search-clear" onClick={() => setProviderSearch('')}>✕</button>
                      )}
                    </div>
                  )}
                  <SortedProviderList
                    providers={filteredProviders.filter((p) =>
                      !providerSearch || p.providerName.toLowerCase().includes(providerSearch.toLowerCase())
                    )}
                    roadsideForm={roadsideForm}
                    setRoadsideForm={setRoadsideForm}
                  />
                </>
              )}
            </>
          )}

          <div className="step-nav">
            <button className="ghost-button" type="button" onClick={() => setStep(2)}>← Back</button>
            <button
              className="primary-cta"
              type="button"
              disabled={filteredProviders.length === 0 || (dispatchMode === 'manual' && !roadsideForm.providerServiceId)}
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
              <strong>{activeCard?.label || serviceFilter}</strong>
            </div>
            {dispatchMode === 'auto' ? (
              <div className="confirm-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginBottom: 8 }}>Provider</span>
                {previewLoading ? (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>Finding best match…</p>
                ) : dispatchPreview ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 12, background: 'rgba(132,204,22,0.06)',
                    border: '1px solid rgba(132,204,22,0.18)',
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(132,204,22,0.15)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700, color: '#84cc16',
                    }}>
                      {dispatchPreview.providerName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 14, display: 'block' }}>{dispatchPreview.providerName}</strong>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 2 }}>
                        {dispatchPreview.avgRating && <span>★ {dispatchPreview.avgRating} ({dispatchPreview.ratingCount})</span>}
                        <span>📍 {dispatchPreview.distanceKm} km away</span>
                        {dispatchPreview.basePriceKsh > 0 && <span>{formatCurrency(dispatchPreview.basePriceKsh)} base</span>}
                      </div>
                      {dispatchPreview.matchBadges?.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                          {dispatchPreview.matchBadges.map((badge) => (
                            <span key={badge} style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                              background: 'rgba(132,204,22,0.15)', color: '#84cc16',
                              letterSpacing: '0.04em', textTransform: 'uppercase',
                            }}>{badge}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', flexShrink: 0 }}>Best match</span>
                  </div>
                ) : (
                  <strong style={{ fontSize: 13 }}>Nearest of {filteredProviders.length} available providers</strong>
                )}
              </div>
            ) : (
              <div className="confirm-row">
                <span>Provider</span>
                <strong>{selectedProviderService?.providerName || '—'}</strong>
              </div>
            )}
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

          {dispatchMode === 'manual' && (
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
          )}

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

          {dispatchMode === 'manual' && totalEstimate > 0 && (
            <div className="estimate-band">
              <span>Estimated total</span>
              <strong>{formatCurrency(totalEstimate)}</strong>
            </div>
          )}

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
