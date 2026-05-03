import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

const providerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [22, 36], iconAnchor: [11, 36], popupAnchor: [1, -30], shadowSize: [36, 36],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function stars(n) {
  if (!n) return '';
  const full = Math.round(n);
  return '★'.repeat(full) + '☆'.repeat(5 - full) + ` ${n.toFixed(1)}`;
}

function formatKsh(v) {
  if (!v) return 'Price on request';
  return `Ksh ${Number(v).toLocaleString()}`;
}

function buildPopup(p) {
  const rating = p.avgRating
    ? `<span style="color:#f59e0b;font-size:12px">${stars(p.avgRating)}</span> <span style="font-size:11px;color:#888">(${p.ratingCount})</span>`
    : `<span style="font-size:11px;color:#888;font-style:italic">New provider</span>`;

  return `
    <div style="min-width:180px;font-family:sans-serif">
      <strong style="font-size:14px;display:block;margin-bottom:2px">${p.providerName}</strong>
      <p style="margin:0 0 4px;font-size:12px;color:#555">${p.serviceName}</p>
      <div style="margin-bottom:4px">${rating}</div>
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#333">
        ${formatKsh(p.basePriceKsh)} base · ${formatKsh(p.pricePerKmKsh)}/km
      </p>
      <button
        onclick="window.__visSelectProvider && window.__visSelectProvider('${p.id}')"
        style="padding:7px 0;background:#84cc16;border:none;border-radius:8px;
               font-weight:700;cursor:pointer;width:100%;font-size:13px;color:#1a2e05"
      >
        Request this provider →
      </button>
    </div>`;
}

export default function NearbyMap({ providers, onSelectProvider }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      null,
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // Initialise map once on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    mapRef.current = map;

    // Provider pins — deduplicate by providerId (not location)
    const seenProviders = new Set();
    const bounds = [];

    providers
      .filter((p) => p.providerBaseLat && p.providerBaseLng)
      .forEach((p) => {
        if (seenProviders.has(p.providerId)) return;
        seenProviders.add(p.providerId);

        const lat = Number(p.providerBaseLat);
        const lng = Number(p.providerBaseLng);
        bounds.push([lat, lng]);

        L.marker([lat, lng], { icon: providerIcon })
          .addTo(map)
          .bindPopup(buildPopup(p), { maxWidth: 240 });
      });

    // Wire up "Request" callback accessible from popup HTML
    window.__visSelectProvider = (serviceId) => {
      const svc = providers.find((pp) => pp.id === serviceId);
      if (svc && onSelectProvider) onSelectProvider(svc);
    };

    // Fit to providers; GPS will pan later when it arrives
    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    } else {
      map.setView([-1.2921, 36.8219], 12);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      customerMarkerRef.current = null;
      delete window.__visSelectProvider;
    };
  }, []);

  // Add / move customer marker whenever GPS position arrives or changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPos) return;

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng([userPos.lat, userPos.lng]);
    } else {
      customerMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon: customerIcon })
        .addTo(map)
        .bindPopup('<strong>📍 You are here</strong>');
    }

    // Pan map to include customer location without full re-fit
    map.panTo([userPos.lat, userPos.lng], { animate: true });
  }, [userPos?.lat, userPos?.lng]);

  const providerCount = providers.filter((p) => p.providerBaseLat).length;

  return (
    <div>
      <div
        ref={containerRef}
        style={{ width: '100%', height: 340, borderRadius: 14, overflow: 'hidden' }}
      />
      <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-soft)' }}>
        {providerCount > 0
          ? `${providerCount} provider${providerCount !== 1 ? 's' : ''} visible · click a pin to request`
          : 'No providers with a set location yet'}
      </p>
    </div>
  );
}
