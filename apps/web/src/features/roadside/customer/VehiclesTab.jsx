import { useState } from 'react';
import VehicleMakeModelFields from '../../../shared/VehicleMakeModelFields';
import VehicleDetailView from './VehicleDetailView';

const SERVICE_ICONS = {
  towing: '🚛', battery_jump_start: '⚡', tyre_change: '🛞',
  lockout_assistance: '🔓', fuel_delivery: '⛽', winching: '⛓️',
  on_site_diagnosis: '🔍', oil_change: '🛢️', minor_repairs: '🔧',
};

const INSIGHTS = [
  { icon: '🔧', text: 'Schedule your next service based on mileage intervals.' },
  { icon: '🛞', text: 'Check tyre pressure monthly for better fuel economy.' },
  { icon: '💧', text: 'Top up engine oil if you have not checked in 3 months.' },
  { icon: '🔋', text: 'Car batteries typically last 3–5 years. Check yours.' },
  { icon: '🧊', text: 'Ensure your coolant level is adequate before long trips.' },
];

function VehicleCard({ vehicle, onView }) {
  const profile = vehicle.profile || {};
  const nextService = profile.nextService;
  const insurance = profile.insurance;

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  }

  const insDays = daysUntil(insurance?.expiryDate);
  const roadDays = daysUntil(profile.roadLicense?.expiryDate);
  const hasAlert = (insDays !== null && insDays < 30) || (roadDays !== null && roadDays < 30);

  return (
    <article className="vehicle-card" style={{ cursor: 'pointer' }} onClick={() => onView(vehicle)}>
      <div className="vehicle-card-plate">
        {vehicle.registrationNumber}
        {hasAlert && <span className="vehicle-card-alert" title="Document expiring soon">⚠️</span>}
      </div>
      <div className="vehicle-card-body">
        <strong className="vehicle-card-name">{vehicle.nickname}</strong>
        <p className="vehicle-card-meta">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        {vehicle.color && <p className="vehicle-card-color">⬤ {vehicle.color}</p>}
        {nextService?.type && (
          <p className="vehicle-card-next-service">
            🔧 Next: {nextService.type}
            {nextService.dueDate && ` · ${new Date(nextService.dueDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`}
          </p>
        )}
      </div>
      <span className="vehicle-card-arrow">›</span>
    </article>
  );
}

function InsightsCarousel() {
  const [idx, setIdx] = useState(0);
  const insight = INSIGHTS[idx % INSIGHTS.length];
  return (
    <div className="vehicle-insights">
      <p className="eyebrow">Car insights</p>
      <div className="vehicle-insights-card">
        <span className="vehicle-insights-icon">{insight.icon}</span>
        <p>{insight.text}</p>
      </div>
      <div className="vehicle-insights-dots">
        {INSIGHTS.map((_, i) => (
          <button key={i} type="button"
            className={`insights-dot ${i === idx % INSIGHTS.length ? 'insights-dot--active' : ''}`}
            onClick={() => setIdx(i)} aria-label={`Insight ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

export default function VehiclesTab({ vehicles, vehicleForm, setVehicleForm, onSubmit, loading, token }) {
  const [showForm, setShowForm] = useState(vehicles.length === 0);
  const [viewingVehicle, setViewingVehicle] = useState(null);

  function onChange(field, value) {
    setVehicleForm((current) => ({ ...current, [field]: value }));
  }

  if (viewingVehicle) {
    return (
      <VehicleDetailView
        vehicle={viewingVehicle}
        token={token}
        onBack={() => setViewingVehicle(null)}
      />
    );
  }

  const single = vehicles.length === 1;

  return (
    <section className="cust-vehicles">
      <div className="cust-vehicles-header">
        <div>
          <p className="eyebrow">Garage</p>
          <h3>My vehicles</h3>
        </div>
        {vehicles.length > 0 && (
          <button
            className={showForm ? 'ghost-button' : 'primary-cta'}
            type="button"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Cancel' : '+ Add vehicle'}
          </button>
        )}
      </div>

      {vehicles.length === 0 && !showForm ? (
        <div className="cust-empty">
          <span style={{ fontSize: 40 }}>🚗</span>
          <p>No vehicles yet. Add your first car to get started.</p>
          <button className="primary-cta" type="button" onClick={() => setShowForm(true)}>
            Add vehicle
          </button>
        </div>
      ) : (
        <div className={`vehicle-grid ${single ? 'vehicle-grid--single' : ''}`}>
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} onView={setViewingVehicle} />
          ))}
          {single && <InsightsCarousel />}
        </div>
      )}

      {showForm && (
        <form className="cust-vehicle-form dashboard-panel" onSubmit={(e) => { onSubmit(e); setShowForm(false); }}>
          <h4 style={{ margin: '0 0 12px' }}>Add a vehicle</h4>
          <div className="form-grid">
            <label>
              <span>Nickname</span>
              <input placeholder="e.g. My Toyota" value={vehicleForm.nickname}
                onChange={(e) => onChange('nickname', e.target.value)} required />
            </label>
            <label>
              <span>Registration plate</span>
              <input placeholder="KCA 000A" value={vehicleForm.registrationNumber}
                onChange={(e) => onChange('registrationNumber', e.target.value)} required />
            </label>
          </div>
          <div className="form-grid">
            <VehicleMakeModelFields make={vehicleForm.make} model={vehicleForm.model}
              year={vehicleForm.year} onChange={onChange} />
          </div>
          <div className="form-grid">
            <label>
              <span>Color</span>
              <input placeholder="e.g. Silver" value={vehicleForm.color ?? ''}
                onChange={(e) => onChange('color', e.target.value)} />
            </label>
          </div>
          <button className="primary-cta" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save vehicle'}
          </button>
        </form>
      )}
    </section>
  );
}
