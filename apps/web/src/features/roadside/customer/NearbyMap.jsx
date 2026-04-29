import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

const providerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [20, 33], iconAnchor: [10, 33], popupAnchor: [1, -28], shadowSize: [33, 33],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [22, 36], iconAnchor: [11, 36], popupAnchor: [1, -30], shadowSize: [36, 36],
});

export default function NearbyMap({ providers, onSelectProvider }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    }, null, { enableHighAccuracy: true, timeout: 8000 });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default centre: Nairobi
    const defaultCenter = userPos
      ? [userPos.lat, userPos.lng]
      : [-1.2921, 36.8219];

    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    mapRef.current = map;

    // Customer marker
    if (userPos) {
      L.marker([userPos.lat, userPos.lng], { icon: customerIcon })
        .addTo(map)
        .bindPopup('<strong>You are here</strong>');
    }

    // Deduplicate providers by location
    const seen = new Set();
    providers
      .filter((p) => p.providerBaseLat && p.providerBaseLng)
      .forEach((p) => {
        const key = `${Number(p.providerBaseLat).toFixed(4)},${Number(p.providerBaseLng).toFixed(4)}`;
        if (seen.has(key)) return;
        seen.add(key);

        const marker = L.marker([Number(p.providerBaseLat), Number(p.providerBaseLng)], { icon: providerIcon })
          .addTo(map);

        marker.bindPopup(
          `<div style="min-width:160px">
            <strong>${p.providerName}</strong>
            <p style="margin:4px 0;font-size:12px;color:#555">${p.serviceName}</p>
            <button
              onclick="window.__visSelectProvider && window.__visSelectProvider('${p.id}')"
              style="margin-top:6px;padding:5px 10px;background:#84cc16;border:none;border-radius:6px;font-weight:700;cursor:pointer;width:100%"
            >Request this provider</button>
          </div>`,
          { maxWidth: 220 },
        );
      });

    // Store callback for popup button
    window.__visSelectProvider = (serviceId) => {
      const svc = providers.find((p) => p.id === serviceId);
      if (svc && onSelectProvider) onSelectProvider(svc);
    };

    const bounds = [];
    if (userPos) bounds.push([userPos.lat, userPos.lng]);
    providers
      .filter((p) => p.providerBaseLat && p.providerBaseLng)
      .forEach((p) => bounds.push([Number(p.providerBaseLat), Number(p.providerBaseLng)]));

    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [32, 32] });
    } else {
      map.setView(defaultCenter, 12);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      delete window.__visSelectProvider;
    };
  }, [userPos, providers.length]);

  return <div ref={containerRef} style={{ width: '100%', height: 300, borderRadius: 14, overflow: 'hidden' }} />;
}
