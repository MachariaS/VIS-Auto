import { useState } from 'react';
import { countryOptions } from './constants';

function splitPhone(full = '') {
  const match = countryOptions.find((c) => full.startsWith(c.phoneCode));
  if (match) return { code: match.phoneCode, number: full.slice(match.phoneCode.length).trim() };
  return { code: '+254', number: full };
}

export default function PhoneField({ value, onChange, required = true }) {
  const initial = splitPhone(value);
  const [code, setCode] = useState(initial.code);
  const [number, setNumber] = useState(initial.number);

  function update(nextCode, nextNumber) {
    const digits = nextNumber.replace(/\D/g, '');
    setCode(nextCode);
    setNumber(digits);
    onChange(`${nextCode}${digits}`);
  }

  return (
    <div className="phone-field">
      <select
        className="phone-code-select"
        value={code}
        onChange={(e) => update(e.target.value, number)}
        aria-label="Country code"
      >
        {countryOptions.map((c) => (
          <option key={c.code} value={c.phoneCode}>
            {c.phoneCode} {c.label}
          </option>
        ))}
      </select>
      <input
        className="phone-number-input"
        type="tel"
        placeholder="712 345 678"
        value={number}
        onChange={(e) => update(code, e.target.value)}
        required={required}
        inputMode="numeric"
        maxLength={12}
      />
    </div>
  );
}
