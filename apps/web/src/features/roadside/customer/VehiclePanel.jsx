import VehicleMakeModelFields from '../../../shared/VehicleMakeModelFields';

export default function VehiclePanel({ vehicleForm, setVehicleForm, onSubmit, loading }) {
  function onChange(field, value) {
    setVehicleForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="dashboard-panel stack" onSubmit={onSubmit}>
      <div className="panel-head">
        <div>
          <p className="eyebrow">Vehicle</p>
          <h3>Add a car</h3>
        </div>
      </div>

      <div className="form-grid">
        <label>
          <span>Nickname</span>
          <input
            placeholder="e.g. My Toyota"
            value={vehicleForm.nickname}
            onChange={(e) => onChange('nickname', e.target.value)}
            required
          />
        </label>
        <label>
          <span>Registration</span>
          <input
            placeholder="KCA 000A"
            value={vehicleForm.registrationNumber}
            onChange={(e) => onChange('registrationNumber', e.target.value)}
            required
          />
        </label>
      </div>

      <div className="form-grid">
        <VehicleMakeModelFields
          make={vehicleForm.make}
          model={vehicleForm.model}
          year={vehicleForm.year}
          onChange={onChange}
        />
      </div>

      <div className="form-grid">
        <label>
          <span>Color</span>
          <input
            placeholder="e.g. Silver"
            value={vehicleForm.color ?? ''}
            onChange={(e) => onChange('color', e.target.value)}
          />
        </label>
        <label>
          <span>Notes</span>
          <input
            placeholder="Any notes about this vehicle"
            value={vehicleForm.notes ?? ''}
            onChange={(e) => onChange('notes', e.target.value)}
          />
        </label>
      </div>

      <button className="form-primary-action" type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save vehicle'}
      </button>
    </form>
  );
}
