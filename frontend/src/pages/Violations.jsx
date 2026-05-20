// frontend/src/pages/Violations.jsx
import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { violationsApi, driversApi, vehiclesApi } from '../api/client';
import { validateForm } from '../utils/validation';

const VIOLATION_TYPES = ['Overspeeding', 'Reckless Driving', 'Illegal Parking', 'Beating Red Light', 'No Helmet', 'No Seatbelt', 'Drunk Driving', 'Illegal Overtaking', 'Obstruction', 'Others'];
// P0 1.2 FIX: Title Case to match DB seeds ('Unpaid'/'Paid' not 'unpaid'/'paid')
const STATUSES = ['Unpaid', 'Paid', 'Contested'];

// P0 1.1 FIX: emptyForm uses backend field names (license_no, plate_no, date, violations[])
const emptyForm = {
  location: '',
  date: '',
  violation_status: 'Unpaid',
  apprehending_officer: '',
  license_no: '',
  plate_no: '',
  violation_type: 'Overspeeding',
  fine_amount: '',
};

const ticketRules = {
  location: { required: true },
  date: { required: true },
  violation_type: { required: true },
  fine_amount: { required: true, type: 'number' },
  apprehending_officer: { required: true }
};

function StatusBadge({ status }) {
  if (!status) return null;
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}

export default function Violations() {
  const [violations, setViolations] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [vioRes, dRes, vRes] = await Promise.all([
        violationsApi.getAll(),
        driversApi.getAll(),
        vehiclesApi.getAll(),
      ]);
      setViolations(Array.isArray(vioRes.data) ? vioRes.data : vioRes.data?.data ?? []);

      const rawDrivers = Array.isArray(dRes.data) ? dRes.data : dRes.data?.data ?? [];
      setDrivers(rawDrivers.map(d => ({
        ...d,
        full_name: [d.fname, d.mname, d.lname].filter(Boolean).join(' '),
      })));

      setVehicles(Array.isArray(vRes.data) ? vRes.data : vRes.data?.data ?? []);
    } catch { setError('Failed to load violations.'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = violations.filter(v => {
    const violationName = v.violations?.[0]?.violation_name || '';
    const driverRef = v.driver_name || v.license_no || '';
    const ticketIdString = v.ticket_id ? `TKT-${String(v.ticket_id).padStart(5, '0')}` : '';

    const matchesSearch = !search.trim() || [
      violationName, v.location, driverRef, v.plate_no, v.apprehending_officer, ticketIdString,
    ].some(f => f?.toLowerCase().includes(search.toLowerCase()));

    // P0 1.2 FIX: case-insensitive comparison handles both DB casing and filter value
    const matchesStatus = !filterStatus || v.violation_status?.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const openAdd = () => { setForm(emptyForm); setModal('add'); setMsg(''); };

  const openEdit = (v) => {
    // P0 1.1 FIX: map stored ticket data back to flat form state using backend field names
    setForm({
      location: v.location ?? '',
      date: v.date ?? '',
      violation_status: v.violation_status ?? 'Unpaid',
      apprehending_officer: v.apprehending_officer ?? '',
      license_no: v.license_no ?? '',
      plate_no: v.plate_no ?? '',
      violation_type: v.violations?.[0]?.violation_name ?? 'Overspeeding',
      fine_amount: v.violations?.[0]?.fine_amount ?? '',
    });
    setSelected(v);
    setModal('edit');
    setMsg('');
  };

  const openView = (v) => { setSelected(v); setModal('view'); };

  const handleSave = async () => {
    // Validate before proceeding
    const errors = validateForm(form, ticketRules);
    if (Object.keys(errors).length > 0) {
      setMsg(`Error: ${Object.values(errors)[0]}`);
      return;
    }
    setSaving(true);
    try {
      if (!form.license_no) { setMsg('Error: Please select a driver.'); setSaving(false); return; }
      if (!form.plate_no) { setMsg('Error: Please select a vehicle.'); setSaving(false); return; }

      const selectedVehicle = vehicles.find(v => v.plate_no === form.plate_no);
      if (!selectedVehicle) { setMsg('Error: Selected vehicle not found.'); setSaving(false); return; }

      // P0 1.1 FIX: payload shape matches backend createTicket expectations exactly
      const payload = {
        location: form.location,
        date: form.date,
        violation_status: form.violation_status,
        apprehending_officer: form.apprehending_officer,
        license_no: form.license_no,
        plate_no: selectedVehicle.plate_no,
        engine_no: selectedVehicle.engine_no,
        chassis_no: selectedVehicle.chassis_no,
        violations: [
          {
            violation_name: form.violation_type,
            fine_amount: Number(form.fine_amount),
          },
        ],
      };

      if (modal === 'add') {
        await violationsApi.create(payload);
      } else {
        await violationsApi.update(selected.ticket_id, payload);
      }

      await load();
      setTimeout(() => { setModal(null); setMsg(''); }, 600);
    } catch (e) {
      setMsg('Error: ' + (e.response?.data?.message ?? e.message));
    }
    setSaving(false);
  };

  const handleDelete = async (v) => {
    if (!window.confirm('Delete violation record?')) return;
    try { await violationsApi.delete(v.ticket_id); load(); }
    catch (e) { alert('Delete failed: ' + (e.response?.data?.message ?? e.message)); }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const FormFields = () => (
    <div className="form-grid">
      <div className="form-group">
        <label className="form-label">Violation Type *</label>
        <input className="form-control" name="violation_type" list="violation-types-list" value={form.violation_type} onChange={handleChange} placeholder="e.g. Overspeeding" />
        <datalist id="violation-types-list">
          {VIOLATION_TYPES.map(t => <option key={t} value={t} />)}
        </datalist>
      </div>
      {/* P0 1.2 FIX: status options use Title Case matching DB ('Unpaid'/'Paid'/'Contested') */}
      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-control" name="violation_status" value={form.violation_status} onChange={handleChange}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {/* P0 1.1 FIX: name="date" (was date_of_violation) */}
      <div className="form-group">
        <label className="form-label">Date of Violation *</label>
        <input className="form-control" type="date" name="date" value={form.date?.split('T')[0] ?? ''} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label className="form-label">Fine Amount (₱) *</label>
        <input className="form-control" type="number" name="fine_amount" value={form.fine_amount} onChange={handleChange} placeholder="2000" />
      </div>
      <div className="form-group full">
        <label className="form-label">Location *</label>
        <input className="form-control" name="location" value={form.location} onChange={handleChange} placeholder="EDSA, Quezon City" />
      </div>
      <div className="form-group">
        <label className="form-label">Apprehending Officer *</label>
        <input className="form-control" name="apprehending_officer" value={form.apprehending_officer} onChange={handleChange} placeholder="PO1 Juan Dela Cruz" />
      </div>
      {/* P0 1.1 FIX: name="license_no" (was driver_id) */}
      <div className="form-group">
        <label className="form-label">Driver *</label>
        <select className="form-control" name="license_no" value={form.license_no} onChange={handleChange}>
          <option value="">— Select Driver —</option>
          {drivers.map(d => <option key={d.license_no} value={d.license_no}>{d.full_name} · {d.license_no}</option>)}
        </select>
      </div>
      {/* P0 1.1 FIX: name="plate_no" (was vehicle_id) */}
      <div className="form-group">
        <label className="form-label">Vehicle *</label>
        <select className="form-control" name="plate_no" value={form.plate_no} onChange={handleChange}>
          <option value="">— Select Vehicle —</option>
          {vehicles.map(v => <option key={v.plate_no} value={v.plate_no}>{v.plate_no} · {v.make} {v.model}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div className="page-content fade-in">
      <div className="table-card">
        <div className="table-header">
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span className="table-header-title">Traffic Violation Records</span>
          <button className="btn btn-yellow btn-sm" onClick={openAdd}>+ File Violation</button>
        </div>
        <div className="table-toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input placeholder="Search by type, location, driver, plate..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* P0 1.2 FIX: filter options use Title Case matching DB */}
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={load}>↺ Refresh</button>
        </div>

        {loading ? (
          <div className="loading"><div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" /></div>
        ) : error ? (
          <div className="alert alert-error" style={{ margin: 16 }}>⚠️ {error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">⚠️</div><p>No violations found.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Ticket ID</th><th>Violation Type</th><th>Driver</th>
                  <th>Plate No.</th><th>Date</th><th>Location</th><th>Fine (₱)</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => (
                  <tr key={v.ticket_id ?? i}>
                    <td style={{ color: 'var(--lto-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--lto-blue)', fontSize: 13 }}>
                        {v.ticket_id ? `TKT-${String(v.ticket_id).padStart(5, '0')}` : '—'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{v.violations?.[0]?.violation_name ?? '—'}</td>
                    <td style={{ fontSize: 12 }}>{v.driver_name ?? v.license_no ?? '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--lto-blue)', fontSize: 12 }}>{v.plate_no ?? '—'}</td>
                    {/* P0 1.1 FIX: use v.date (backend field, was v.date_of_violation) */}
                    <td style={{ fontSize: 12 }}>{v.date ? new Date(v.date).toLocaleDateString('en-PH') : '—'}</td>
                    <td style={{ fontSize: 12 }}>{v.location ?? '—'}</td>
                    <td style={{ fontWeight: 700 }}>₱{Number(v.violations?.[0]?.fine_amount ?? 0).toLocaleString()}</td>
                    <td><StatusBadge status={v.violation_status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openView(v)}>View</button>
                        <button className="btn btn-primary btn-sm" onClick={() => openEdit(v)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? '⚠️ File Traffic Violation' : '✏️ Edit Violation'} onClose={() => setModal(null)}
          footer={<>
            {msg && <span style={{ fontSize: 12, color: msg.startsWith('Error') ? 'var(--lto-red)' : 'green', flex: 1 }}>{msg}</span>}
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </>}>
          {FormFields()}
        </Modal>
      )}

      {modal === 'view' && selected && (
        <Modal title="⚠️ Violation Details" onClose={() => setModal(null)}
          footer={<><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button></>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['Ticket ID', selected.ticket_id ? `TKT-${String(selected.ticket_id).padStart(5, '0')}` : '—'],
              ['Violation Type', selected.violations?.[0]?.violation_name],
              ['Status', selected.violation_status],
              ['Date', selected.date ? new Date(selected.date).toLocaleDateString('en-PH') : '—'],
              ['Fine Amount', `₱${Number(selected.violations?.[0]?.fine_amount ?? 0).toLocaleString()}`],
              ['Location', selected.location],
              ['Officer', selected.apprehending_officer ?? '—'],
              ['Driver', selected.driver_name ?? selected.license_no ?? '—'],
              ['Vehicle', selected.plate_no ?? '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--lto-blue)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{val || '—'}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}