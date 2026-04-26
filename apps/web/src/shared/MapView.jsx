import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default Leaflet marker icons broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const providerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, map.getZoom()); }, [center]);
  return null;
}

export default function MapView({
  customerLat,
  customerLng,
  providerLat,
  providerLng,
  customerLabel = 'Your location',
  providerLabel = 'Provider',
  height = 280,
  className = '',
}) {
  const hasCustomer = customerLat && customerLng;
  const hasProvider = providerLat && providerLng;

  const center = hasCustomer
    ? [Number(customerLat), Number(customerLng)]
    : [-1.2921, 36.8219];

  const zoom = hasCustomer ? 13 : 7;

  const positions = [
    hasCustomer ? [Number(customerLat), Number(customerLng)] : null,
    hasProvider ? [Number(providerLat), Number(providerLng)] : null,
  ].filter(Boolean);

  return (
    <div className={`map-view-wrap ${className}`} style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', borderRadius: '12px' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasCustomer && (
          <Marker position={[Number(customerLat), Number(customerLng)]} icon={customerIcon}>
            <Popup>{customerLabel}</Popup>
          </Marker>
        )}
        {hasProvider && (
          <Marker position={[Number(providerLat), Number(providerLng)]} icon={providerIcon}>
            <Popup>{providerLabel}</Popup>
          </Marker>
        )}
        {positions.length === 2 && (
          <Polyline positions={positions} color="#84cc16" weight={3} dashArray="6 4" />
        )}
        <FlyTo center={hasProvider ? [Number(providerLat), Number(providerLng)] : null} />
      </MapContainer>
    </div>
  );
}
