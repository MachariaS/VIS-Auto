import { useEffect, useRef } from 'react';
import L from 'leaflet';

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

async function fetchRoute(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes?.[0]) {
      const route = data.routes[0];
      return {
        coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distanceKm: (route.distance / 1000).toFixed(1),
        durationMin: Math.ceil(route.duration / 60),
      };
    }
  } catch { /* fall back to straight line */ }
  return null;
}

export default function LiveMap({ customerLat, customerLng, providerLat, providerLng, isLiveLocation }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const providerMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const etaBannerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    mapRef.current = map;

    customerMarkerRef.current = L.marker([customerLat, customerLng], { icon: greenIcon })
      .addTo(map)
      .bindPopup('Your location');

    map.setView([customerLat, customerLng], 14);

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !providerLat || !providerLng) return;

    // Place/update provider marker
    if (providerMarkerRef.current) {
      providerMarkerRef.current.setLatLng([providerLat, providerLng]);
    } else {
      providerMarkerRef.current = L.marker([providerLat, providerLng], { icon: blueIcon })
        .addTo(map)
        .bindPopup(isLiveLocation ? 'Provider (live)' : 'Provider base location');
    }

    // Fetch road route and draw it
    fetchRoute(providerLat, providerLng, customerLat, customerLng).then((route) => {
      if (!map) return;

      // Remove previous route layer
      if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); }
      if (etaBannerRef.current) { map.removeLayer(etaBannerRef.current); }

      if (route) {
        routeLayerRef.current = L.polyline(route.coords, {
          color: '#84cc16', weight: 4, opacity: 0.8,
        }).addTo(map);

        // ETA banner at midpoint
        const mid = route.coords[Math.floor(route.coords.length / 2)];
        etaBannerRef.current = L.marker(mid, {
          icon: L.divIcon({
            className: '',
            html: `<div class="map-eta-badge">${route.distanceKm} km · ~${route.durationMin} min</div>`,
            iconAnchor: [40, 12],
          }),
        }).addTo(map);
      } else {
        // Fallback: straight dashed line
        routeLayerRef.current = L.polyline(
          [[providerLat, providerLng], [customerLat, customerLng]],
          { color: '#84cc16', weight: 3, dashArray: '6 4', opacity: 0.7 },
        ).addTo(map);
      }

      // Fit map to show both markers
      map.fitBounds(
        L.latLngBounds([[customerLat, customerLng], [providerLat, providerLng]]),
        { padding: [40, 40] },
      );
    });
  }, [providerLat, providerLng, customerLat, customerLng]);

  return <div ref={containerRef} style={{ width: '100%', height: 300 }} />;
}
