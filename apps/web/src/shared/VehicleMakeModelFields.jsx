import { useState } from 'react';
import { VEHICLE_MAKES, VEHICLE_MODELS, VEHICLE_YEARS } from './vehicleData';

export default function VehicleMakeModelFields({ make, model, year, onChange }) {
  const [makeInput, setMakeInput] = useState(make || '');

  const normalizedMake = Object.keys(VEHICLE_MODELS).find(
    (m) => m.toLowerCase() === makeInput.trim().toLowerCase(),
  ) ?? null;

  const models = normalizedMake ? VEHICLE_MODELS[normalizedMake] : [];

  function handleMakeChange(value) {
    setMakeInput(value);
    const matched = Object.keys(VEHICLE_MODELS).find(
      (m) => m.toLowerCase() === value.trim().toLowerCase(),
    );
    onChange('make', value);
    if (matched !== normalizedMake) onChange('model', '');
  }

  return (
    <>
      <label>
        <span>Make</span>
        <div className="make-input-wrap">
          <input
            list="vehicle-makes-list"
            placeholder="e.g. Toyota"
            value={makeInput}
            onChange={(e) => handleMakeChange(e.target.value)}
            autoComplete="off"
            required
          />
          <datalist id="vehicle-makes-list">
            {VEHICLE_MAKES.map((m) => <option key={m} value={m} />)}
          </datalist>
        </div>
      </label>

      <label>
        <span>Model</span>
        {models.length > 0 ? (
          <select
            value={model}
            onChange={(e) => onChange('model', e.target.value)}
            required
          >
            <option value="">Select model</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        ) : (
          <input
            placeholder={makeInput ? 'Enter model' : 'Enter make first'}
            value={model}
            onChange={(e) => onChange('model', e.target.value)}
            required
          />
        )}
      </label>

      <label>
        <span>Year</span>
        <select
          value={year || ''}
          onChange={(e) => onChange('year', Number(e.target.value))}
          required
        >
          <option value="">Select year</option>
          {VEHICLE_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>
    </>
  );
}
