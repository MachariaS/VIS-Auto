import { useState } from 'react';
import { formatCurrency, request } from '../../../shared/helpers';

const SERVICE_TYPES = [
  'Oil change', 'Major service', 'Minor service', 'Brake service',
  'Tyre replacement', 'Battery replacement', 'AC service',
  'Suspension service', 'Electrical repair', 'Body repair', 'Other',
];

const COVER_TYPES = ['comprehensive', 'third_party', 'third_party_fire_theft'];

function Section({ title, icon, children }) {
  return (
    <div className="vd-section">
      <h4 className="vd-section-title"><span>{icon}</span>{title}</h4>
      {children}
    </div>
  );
}

function InfoRow({ label, value, placeholder = '—' }) {
  return (
    <div className="vd-info-row">
      <span className="vd-info-label">{label}</span>
      <strong className="vd-info-value">{value || placeholder}</strong>
    </div>
  );
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / 86400000);
}

function ExpiryBadge({ date }) {
  if (!date) return null;
  const days = daysUntil(date);
  const color = days < 0 ? '#ef4444' : days < 30 ? '#f59e0b' : '#10b981';
  const label = days < 0 ? 'Expired' : days === 0 ? 'Expires today' : `${days}d left`;
  return <span className="vd-expiry-badge" style={{ color, borderColor: color }}>{label}</span>;
}

function newServiceRecord() {
  return { id: Date.now().toString(), date: '', type: 'Oil change', mileage: '', provider: '', costKsh: '', parts: '', notes: '' };
}

export default function VehicleDetailView({ vehicle, token, onBack }) {
  const p = vehicle.profile || {};
  const [profile, setProfile] = useState({
    mileage: p.mileage || { current: '', lastUpdated: '' },
    serviceHistory: p.serviceHistory || [],
    nextService: p.nextService || { type: 'Oil change', dueDate: '', dueMileage: '', notes: '' },
    insurance: p.insurance || { insurer: '', policyNumber: '', expiryDate: '', coverType: 'comprehensive', premium: '' },
    roadLicense: p.roadLicense || { expiryDate: '', licenseNumber: '' },
    documents: p.documents || { logbookNumber: '', inspectionDue: '' },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const [newRecord, setNewRecord] = useState(newServiceRecord());

  function update(section, field, value) {
    setProfile((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      await request(`/vehicles/${vehicle.id}/profile`, profile, 'PATCH', token);
      setSaved(true);
    } catch { /* non-fatal */ } finally {
      setSaving(false);
    }
  }

  function addServiceRecord() {
    const record = {
      ...newRecord,
      parts: newRecord.parts.split(',').map((s) => s.trim()).filter(Boolean),
    };
    setProfile((prev) => ({
      ...prev,
      serviceHistory: [record, ...prev.serviceHistory],
    }));
    setNewRecord(newServiceRecord());
    setAddingService(false);
    setSaved(false);
  }

  function removeServiceRecord(id) {
    setProfile((prev) => ({
      ...prev,
      serviceHistory: prev.serviceHistory.filter((r) => r.id !== id),
    }));
    setSaved(false);
  }

  const mileage = Number(profile.mileage.current) || 0;
  const lastService = profile.serviceHistory[0];
  const nextServiceMileage = Number(profile.nextService.dueMileage) || 0;
  const kmToNextService = nextServiceMileage > mileage ? nextServiceMileage - mileage : null;

  return (
    <div className="vd-wrap">
      <div className="vd-header">
        <button type="button" className="ghost-button vd-back" onClick={onBack}>← Back</button>
        <div>
          <p className="eyebrow">Vehicle record</p>
          <h3>{vehicle.nickname} — {vehicle.registrationNumber}</h3>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>
            {vehicle.year} {vehicle.make} {vehicle.model}{vehicle.color ? ` · ${vehicle.color}` : ''}
          </p>
        </div>
        <button className="primary-cta" type="button" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>

      {/* ── Quick summary strip ── */}
      <div className="vd-strip">
        <div className="vd-kpi">
          <span>Current mileage</span>
          <strong>{mileage ? `${mileage.toLocaleString()} km` : '—'}</strong>
        </div>
        <div className="vd-kpi">
          <span>Last service</span>
          <strong>{lastService ? new Date(lastService.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</strong>
        </div>
        <div className="vd-kpi">
          <span>Next service</span>
          <strong>
            {profile.nextService.dueDate
              ? new Date(profile.nextService.dueDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
              : kmToNextService
              ? `in ${kmToNextService.toLocaleString()} km`
              : '—'}
          </strong>
        </div>
        <div className="vd-kpi">
          <span>Insurance</span>
          <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {profile.insurance.insurer || '—'}
            <ExpiryBadge date={profile.insurance.expiryDate} />
          </strong>
        </div>
      </div>

      <div className="vd-body">

        {/* ── Mileage ── */}
        <Section title="Mileage" icon="📏">
          <div className="form-grid">
            <label><span>Current odometer (km)</span>
              <input type="number" min="0" value={profile.mileage.current}
                onChange={(e) => update('mileage', 'current', e.target.value)} />
            </label>
            <label><span>Last updated</span>
              <input type="date" value={profile.mileage.lastUpdated}
                onChange={(e) => update('mileage', 'lastUpdated', e.target.value)} />
            </label>
          </div>
        </Section>

        {/* ── Next service ── */}
        <Section title="Next service due" icon="🔧">
          <div className="form-grid">
            <label><span>Service type</span>
              <select value={profile.nextService.type}
                onChange={(e) => update('nextService', 'type', e.target.value)}>
                {SERVICE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label><span>Due date</span>
              <input type="date" value={profile.nextService.dueDate}
                onChange={(e) => update('nextService', 'dueDate', e.target.value)} />
            </label>
            <label><span>Due mileage (km)</span>
              <input type="number" min="0" placeholder="e.g. 75000" value={profile.nextService.dueMileage}
                onChange={(e) => update('nextService', 'dueMileage', e.target.value)} />
            </label>
            <label><span>Notes</span>
              <input placeholder="e.g. Full service + timing belt" value={profile.nextService.notes}
                onChange={(e) => update('nextService', 'notes', e.target.value)} />
            </label>
          </div>
          {kmToNextService !== null && (
            <div className="vd-alert vd-alert--info">
              🔧 Next service in <strong>{kmToNextService.toLocaleString()} km</strong>
              {profile.nextService.dueDate && ` or by ${new Date(profile.nextService.dueDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long' })}`}
            </div>
          )}
        </Section>

        {/* ── Service history ── */}
        <Section title="Service history" icon="📋">
          {profile.serviceHistory.length > 0 && (
            <div className="vd-history-list">
              {profile.serviceHistory.map((r) => (
                <div key={r.id} className="vd-history-card">
                  <div className="vd-history-head">
                    <div>
                      <strong>{r.type}</strong>
                      <span>{r.date ? new Date(r.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {r.costKsh && <span className="vd-cost">{formatCurrency(r.costKsh)}</span>}
                      <button type="button" className="ghost-button danger" style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => removeServiceRecord(r.id)}>Remove</button>
                    </div>
                  </div>
                  <div className="vd-history-meta">
                    {r.mileage && <InfoRow label="Mileage" value={`${Number(r.mileage).toLocaleString()} km`} />}
                    {r.provider && <InfoRow label="Provider" value={r.provider} />}
                    {Array.isArray(r.parts) && r.parts.length > 0 && (
                      <InfoRow label="Parts" value={r.parts.join(', ')} />
                    )}
                    {r.notes && <InfoRow label="Notes" value={r.notes} />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {addingService ? (
            <div className="vd-add-service-form dashboard-panel">
              <h5 style={{ margin: '0 0 12px' }}>Add service record</h5>
              <div className="form-grid">
                <label><span>Date</span>
                  <input type="date" value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })} />
                </label>
                <label><span>Service type</span>
                  <select value={newRecord.type}
                    onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}>
                    {SERVICE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label><span>Mileage at service (km)</span>
                  <input type="number" min="0" value={newRecord.mileage}
                    onChange={(e) => setNewRecord({ ...newRecord, mileage: e.target.value })} />
                </label>
                <label><span>Provider / Garage</span>
                  <input placeholder="Garage or provider name" value={newRecord.provider}
                    onChange={(e) => setNewRecord({ ...newRecord, provider: e.target.value })} />
                </label>
                <label><span>Cost (Ksh)</span>
                  <input type="number" min="0" value={newRecord.costKsh}
                    onChange={(e) => setNewRecord({ ...newRecord, costKsh: e.target.value })} />
                </label>
                <label><span>Parts replaced (comma-separated)</span>
                  <input placeholder="Oil filter, brake pads, air filter" value={newRecord.parts}
                    onChange={(e) => setNewRecord({ ...newRecord, parts: e.target.value })} />
                </label>
              </div>
              <label><span>Notes</span>
                <textarea rows={2} placeholder="Any additional notes from the garage visit"
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })} />
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="primary-cta" type="button" onClick={addServiceRecord}>Add record</button>
                <button className="ghost-button" type="button" onClick={() => setAddingService(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="ghost-button" type="button" onClick={() => setAddingService(true)}>
              + Add service record
            </button>
          )}
        </Section>

        {/* ── Insurance ── */}
        <Section title="Insurance" icon="🛡️">
          <div className="form-grid">
            <label><span>Insurer</span>
              <input placeholder="e.g. Jubilee Insurance" value={profile.insurance.insurer}
                onChange={(e) => update('insurance', 'insurer', e.target.value)} />
            </label>
            <label><span>Policy number</span>
              <input placeholder="Policy number" value={profile.insurance.policyNumber}
                onChange={(e) => update('insurance', 'policyNumber', e.target.value)} />
            </label>
            <label><span>Cover type</span>
              <select value={profile.insurance.coverType}
                onChange={(e) => update('insurance', 'coverType', e.target.value)}>
                <option value="comprehensive">Comprehensive</option>
                <option value="third_party">Third party</option>
                <option value="third_party_fire_theft">Third party, fire & theft</option>
              </select>
            </label>
            <label><span>Expiry date</span>
              <input type="date" value={profile.insurance.expiryDate}
                onChange={(e) => update('insurance', 'expiryDate', e.target.value)} />
            </label>
            <label><span>Annual premium (Ksh)</span>
              <input type="number" min="0" value={profile.insurance.premium}
                onChange={(e) => update('insurance', 'premium', e.target.value)} />
            </label>
          </div>
          {profile.insurance.expiryDate && (
            <div className={`vd-alert ${daysUntil(profile.insurance.expiryDate) < 30 ? 'vd-alert--warn' : 'vd-alert--info'}`}>
              🛡️ Insurance <ExpiryBadge date={profile.insurance.expiryDate} />
            </div>
          )}
        </Section>

        {/* ── Road license & documents ── */}
        <Section title="Road license & documents" icon="📄">
          <div className="form-grid">
            <label><span>Road license number</span>
              <input placeholder="License number" value={profile.roadLicense.licenseNumber}
                onChange={(e) => update('roadLicense', 'licenseNumber', e.target.value)} />
            </label>
            <label><span>Road license expiry</span>
              <input type="date" value={profile.roadLicense.expiryDate}
                onChange={(e) => update('roadLicense', 'expiryDate', e.target.value)} />
            </label>
            <label><span>Logbook number</span>
              <input placeholder="Logbook / title number" value={profile.documents.logbookNumber}
                onChange={(e) => update('documents', 'logbookNumber', e.target.value)} />
            </label>
            <label><span>Inspection due date</span>
              <input type="date" value={profile.documents.inspectionDue}
                onChange={(e) => update('documents', 'inspectionDue', e.target.value)} />
            </label>
          </div>
          {profile.roadLicense.expiryDate && (
            <div className={`vd-alert ${daysUntil(profile.roadLicense.expiryDate) < 30 ? 'vd-alert--warn' : 'vd-alert--info'}`}>
              📄 Road license <ExpiryBadge date={profile.roadLicense.expiryDate} />
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}
