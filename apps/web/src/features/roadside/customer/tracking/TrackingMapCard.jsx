import { useEffect, useState } from 'react';

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function useAddress(lat, lng) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!lat || !lng) return;
    const key = `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
    const cached = sessionStorage.getItem(`addr:${key}`);
    if (cached) { setLabel(cached); return; }
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } },
    )
      .then((r) => r.json())
      .then((data) => {
        const addr = data?.address;
        const parts = [
          addr?.amenity || addr?.building || addr?.shop || addr?.road,
          addr?.suburb || addr?.neighbourhood,
          addr?.city || addr?.town || addr?.village,
        ].filter(Boolean).slice(0, 2).join(', ');
        const result = parts || data?.display_name?.split(',').slice(0, 2).join(',').trim() || `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
        sessionStorage.setItem(`addr:${key}`, result);
        setLabel(result);
      })
      .catch(() => setLabel(`${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`));
  }, [lat, lng]);
  return label;
}

function buildMapSrc(cLat, cLng, pLat, pLng) {
  if (!cLat || !cLng) return null;
  if (pLat && pLng) {
    const pad = 0.008;
    const minLat = Math.min(Number(cLat), Number(pLat)) - pad;
    const maxLat = Math.max(Number(cLat), Number(pLat)) + pad;
    const minLng = Math.min(Number(cLng), Number(pLng)) - pad;
    const maxLng = Math.max(Number(cLng), Number(pLng)) + pad;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${cLat},${cLng}`;
  }
  const pad = 0.01;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${Number(cLng) - pad},${Number(cLat) - pad},${Number(cLng) + pad},${Number(cLat) + pad}&layer=mapnik&marker=${cLat},${cLng}`;
}

export default function TrackingMapCard({ requestItem, tracking }) {
  const providerLocation = tracking?.providerLocation;
  const cLat = requestItem?.latitude;
  const cLng = requestItem?.longitude;
  const pLat = providerLocation?.latitude;
  const pLng = providerLocation?.longitude;

  const customerAddress = useAddress(cLat, cLng);
  const providerAddress = useAddress(pLat, pLng);

  const distance =
    cLat && cLng && pLat && pLng
      ? haversineKm(Number(cLat), Number(cLng), Number(pLat), Number(pLng))
      : null;

  const status = tracking?.status ?? requestItem?.status ?? 'searching';
  const mapSrc = buildMapSrc(cLat, cLng, pLat, pLng);
  const osmHref = cLat && cLng
    ? `https://www.openstreetmap.org/?mlat=${cLat}&mlon=${cLng}#map=15/${cLat}/${cLng}`
    : '#';

  return (
    <article className="tracking-map-card">
      <div className="tracking-map-head">
        <div>
          <h5>Live map</h5>
          <p className="tracking-map-disclaimer">
            {distance !== null
              ? `${distance.toFixed(1)} km between you and provider`
              : 'Waiting for provider location'}
          </p>
        </div>
        <span className="tracking-status-badge">{status.replaceAll('_', ' ')}</span>
      </div>

      {mapSrc ? (
        <div className="tracking-map-frame-wrap">
          <iframe
            title="Dispatch map"
            src={mapSrc}
            className="tracking-map-frame"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <a
            href={osmHref}
            target="_blank"
            rel="noopener noreferrer"
            className="tracking-map-osm-link"
          >
            Open in OpenStreetMap ↗
          </a>
        </div>
      ) : (
        <div className="tracking-map-placeholder">📍 Waiting for location…</div>
      )}

      <div className="tracking-locations">
        <div className="tracking-location-row">
          <span className="tracking-location-dot tracking-location-dot--customer" />
          <div>
            <label>Your location</label>
            <strong>{customerAddress || 'Locating…'}</strong>
          </div>
        </div>
        <div className="tracking-location-row">
          <span className="tracking-location-dot tracking-location-dot--provider" />
          <div>
            <label>Provider</label>
            <strong>
              {pLat && pLng
                ? providerAddress || 'Resolving…'
                : 'Waiting for provider location'}
            </strong>
          </div>
        </div>
        {distance !== null && (
          <div className="tracking-distance-badge">
            📏 {distance.toFixed(1)} km apart
          </div>
        )}
      </div>
    </article>
  );
}
