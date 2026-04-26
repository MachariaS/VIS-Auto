import { useMapEvents, MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.flyTo([lat, lng], 15); }, [lat, lng]);
  return null;
}

export default function LocationPickerMap({ lat, lng, onPick, height = 260 }) {
  const center = lat && lng ? [Number(lat), Number(lng)] : [-1.2921, 36.8219];

  return (
    <div className="location-picker-wrap" style={{ height, borderRadius: 12, overflow: 'hidden' }}>
      <p className="location-picker-hint">Tap on the map to set your location</p>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onPick} />
        {lat && lng && <Marker position={[Number(lat), Number(lng)]} />}
        <Recenter lat={lat} lng={lng} />
      </MapContainer>
    </div>
  );
}
