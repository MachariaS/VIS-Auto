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

export default function LiveMap({ customerLat, customerLng, providerLat, providerLng }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const providerMarkerRef = useRef(null);
  const polylineRef = useRef(null);

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

  // Update provider marker and polyline when provider location changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (providerLat && providerLng) {
      if (providerMarkerRef.current) {
        providerMarkerRef.current.setLatLng([providerLat, providerLng]);
      } else {
        providerMarkerRef.current = L.marker([providerLat, providerLng], { icon: blueIcon })
          .addTo(map)
          .bindPopup('Provider');
      }

      const points = [[customerLat, customerLng], [providerLat, providerLng]];

      if (polylineRef.current) {
        polylineRef.current.setLatLngs(points);
      } else {
        polylineRef.current = L.polyline(points, { color: '#84cc16', weight: 3, dashArray: '6 4' }).addTo(map);
      }

      // Fit map to show both markers
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
  }, [providerLat, providerLng, customerLat, customerLng]);

  return <div ref={containerRef} style={{ width: '100%', height: 280 }} />;
}
