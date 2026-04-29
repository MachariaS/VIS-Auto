import { useState } from 'react';
import { getApiUrl, request } from '../../shared/helpers';

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
    );
    const data = await res.json();
    if (data?.display_name) {
      const parts = data.display_name.split(',').slice(0, 4).join(', ').trim();
      return parts;
    }
  } catch { /* silent */ }
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
}

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
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export default function GarageLocationStep({ token, user, onComplete, onSkip }) {
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestTimer, setSuggestTimer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [message, setMessage] = useState('');

  function handleAddressChange(val) {
    setAddress(val);
    clearTimeout(suggestTimer);
    if (val.length < 3) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      const results = await suggestLocations(val, lat || null, lng || null);
      setSuggestions(results.slice(0, 6));
    }, 400);
    setSuggestTimer(t);
  }

  function pickSuggestion(s) {
    setAddress(s.address || s.name || '');
    setLat(String(s.lat));
    setLng(String(s.lng));
    setSuggestions([]);
  }

  async function useGps() {
    if (!navigator.geolocation) { setMessage('GPS not available.'); return; }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const pLat = pos.coords.latitude.toFixed(6);
        const pLng = pos.coords.longitude.toFixed(6);
        setLat(pLat);
        setLng(pLng);
        const addr = await reverseGeocode(pLat, pLng);
        setAddress(addr);
        setSuggestions([]);
        setGpsBusy(false);
      },
      () => { setMessage('Could not get your location.'); setGpsBusy(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSave() {
    if (!lat || !lng) { setMessage('Please set your garage location first.'); return; }
    setLoading(true);
    try {
      // Patch the user profile with the base location
      await request('/users/me/profile', {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        profile: {
          business: {
            locations: [{
              branchName: 'Main Branch',
              address,
              latitude: lat,
              longitude: lng,
            }],
          },
        },
      }, 'PATCH', token);
      onComplete();
    } catch (e) {
      setMessage(e.message || 'Unable to save location.');
      setLoading(false);
    }
  }

  const hasLocation = lat && lng;

  return (
    <div className="auth-shell stack">
      <div className="auth-head">
        <span className="mini-pill">Setup · Step 2 of 2</span>
        <h2>Where is your garage?</h2>
        <p className="auth-copy">
          Your base location helps customers find you and calculates accurate distances.
          This is shown as your starting point for jobs.
        </p>
      </div>

      <div style={{ position: 'relative' }}>
        <label>
          <span>Garage / depot address</span>
          <input
            placeholder="Search your garage or area..."
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            autoComplete="off"
          />
        </label>
        {suggestions.length > 0 && (
          <ul className="address-suggestions" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50 }}>
            {suggestions.map((s, i) => (
              <li key={i}>
                <button type="button" onClick={() => pickSuggestion(s)}>
                  <strong>{(s.name || s.address || '').split(',')[0]}</strong>
                  <span>{(s.address || '').split(',').slice(1, 3).join(',').trim()}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="ghost-button" type="button" onClick={useGps} disabled={gpsBusy}>
        {gpsBusy ? 'Getting location…' : '📍 Use my current GPS location'}
      </button>

      {hasLocation && (
        <div className="garage-location-preview">
          <span>📍</span>
          <div>
            <strong>{address || `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`}</strong>
            <p>This will be shown as your starting point for distance estimates.</p>
          </div>
        </div>
      )}

      {message && <div className="status-banner">{message}</div>}

      <button
        className="form-primary-action"
        type="button"
        onClick={handleSave}
        disabled={loading || !hasLocation}
      >
        {loading ? 'Saving…' : 'Save location and continue'}
      </button>

      <button className="ghost-button" type="button" onClick={onSkip}>
        Skip — I'll set this in my profile later
      </button>
    </div>
  );
}
