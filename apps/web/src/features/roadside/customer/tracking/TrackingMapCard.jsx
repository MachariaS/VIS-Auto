import { lazy, Suspense, useEffect, useState } from 'react';

const LiveMap = lazy(() => import('./LiveMap'));

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

const addrCache = {};
function useAddress(lat, lng) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!lat || !lng) return;
    const key = `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
    if (addrCache[key]) { setLabel(addrCache[key]); return; }
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
      .then((r) => r.json())
      .then((d) => {
        const a = d?.address;
        const result = [a?.road || a?.amenity, a?.suburb || a?.city || a?.town].filter(Boolean).join(', ')
          || d?.display_name?.split(',').slice(0, 2).join(',').trim()
          || `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
        addrCache[key] = result;
        setLabel(result);
      })
      .catch(() => setLabel(`${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`));
  }, [lat, lng]);
  return label;
}

export default function TrackingMapCard({ requestItem, tracking }) {
  const providerLocation = tracking?.providerLocation;
  const cLat = requestItem?.latitude;
  const cLng = requestItem?.longitude;
  const pLat = providerLocation?.latitude;
  const pLng = providerLocation?.longitude;

  const customerAddr = useAddress(cLat, cLng);
  const providerAddr = useAddress(pLat, pLng);

  const distance = cLat && cLng && pLat && pLng
    ? haversineKm(Number(cLat), Number(cLng), Number(pLat), Number(pLng))
    : null;

  const status = tracking?.status ?? requestItem?.status ?? 'searching';
  const eta = tracking?.etaMinutes ?? requestItem?.etaMinutes;

  return (
    <article className="tracking-map-card">
      <div className="tracking-map-head">
        <div>
          <h5>Live map</h5>
          <p className="tracking-map-disclaimer">
            {distance !== null
              ? `${distance.toFixed(1)} km away · ETA ${eta ?? '?'} min`
              : 'Locating provider…'}
          </p>
        </div>
        <span className="tracking-status-badge">{status.replaceAll('_', ' ')}</span>
      </div>

      <Suspense fallback={<div className="tracking-map-placeholder">Loading map…</div>}>
        {cLat && cLng ? (
          <LiveMap
            customerLat={Number(cLat)}
            customerLng={Number(cLng)}
            providerLat={pLat ? Number(pLat) : null}
            providerLng={pLng ? Number(pLng) : null}
          />
        ) : (
          <div className="tracking-map-placeholder">📍 Waiting for location…</div>
        )}
      </Suspense>

      <div className="tracking-locations">
        <div className="tracking-location-row">
          <span className="tracking-location-dot tracking-location-dot--customer" />
          <div><label>Your location</label><strong>{customerAddr || 'Locating…'}</strong></div>
        </div>
        <div className="tracking-location-row">
          <span className="tracking-location-dot tracking-location-dot--provider" />
          <div>
            <label>Provider</label>
            <strong>{pLat ? (providerAddr || 'Resolving…') : 'Waiting for provider location'}</strong>
          </div>
        </div>
        {distance !== null && (
          <div className="tracking-distance-badge">
            📏 {distance.toFixed(1)} km · ~{eta ?? Math.ceil(distance * 2)} min ETA
          </div>
        )}
      </div>
    </article>
  );
}
