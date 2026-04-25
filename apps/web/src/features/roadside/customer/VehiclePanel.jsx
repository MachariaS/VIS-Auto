import { initialVehicle } from '../../../shared/constants';

export default function VehiclePanel({ vehicleForm, setVehicleForm, onSubmit, loading }) {
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
            value={vehicleForm.nickname}
            onChange={(event) => setVehicleForm({ ...vehicleForm, nickname: event.target.value })}
          />
        </label>
        <label>
          <span>Make</span>
          <input
            value={vehicleForm.make}
            onChange={(event) => setVehicleForm({ ...vehicleForm, make: event.target.value })}
          />
        </label>
        <label>
          <span>Model</span>
          <input
            value={vehicleForm.model}
            onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })}
          />
        </label>
        <label>
          <span>Year</span>
          <input
            type="number"
            value={vehicleForm.year}
            onChange={(event) =>
              setVehicleForm({ ...vehicleForm, year: Number(event.target.value) })
            }
          />
        </label>
        <label>
          <span>Registration</span>
          <input
            value={vehicleForm.registrationNumber}
            onChange={(event) =>
              setVehicleForm({ ...vehicleForm, registrationNumber: event.target.value })
            }
          />
        </label>
        <label>
          <span>Color</span>
          <input
            value={vehicleForm.color}
            onChange={(event) => setVehicleForm({ ...vehicleForm, color: event.target.value })}
          />
        </label>
      </div>
      <label>
        <span>Notes</span>
        <textarea
          value={vehicleForm.notes}
          onChange={(event) => setVehicleForm({ ...vehicleForm, notes: event.target.value })}
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save vehicle'}
      </button>
    </form>
  );
}
