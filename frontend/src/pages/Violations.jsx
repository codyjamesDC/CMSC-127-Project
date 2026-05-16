import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { violationsApi, driversApi, vehiclesApi } from '../api/client';

const VIOLATION_TYPES = ['Overspeeding', 'Reckless Driving', 'Illegal Parking', 'Beating Red Light', 'No Helmet', 'No Seatbelt', 'Drunk Driving', 'Illegal Overtaking', 'Obstruction', 'Others'];
const STATUSES = ['unpaid', 'paid', 'contested'];
const emptyForm = { violation_type: 'Overspeeding', date_of_violation: '', location: '', fine_amount: '', apprehending_officer: '', violation_status: 'unpaid', driver_id: '', vehicle_id: '' };

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
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
        violationsApi.getAll({ violation_status: filterStatus }),
        driversApi.getAll(),
        vehiclesApi.getAll(),
      ]);
      setViolations(Array.isArray(vioRes.data) ? vioRes.data : vioRes.data?.data ?? []);
      setDrivers(Array.isArray(dRes.data) ? dRes.data : dRes.data?.data ?? []);
      setVehicles(Array.isArray(vRes.data) ? vRes.data : vRes.data?.data ?? []);
    } catch { setError('Failed to load violations.'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus]);

  const filtered = violations.filter(v =>
    [v.violation_type, v.location, v.driver_name, v.plate_number, v.apprehending_officer].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setForm(emptyForm); setModal('add'); setMsg(''); };
  const openEdit = (v) => { setForm({ ...v }); setSelected(v); setModal('edit'); setMsg(''); };
  const openView = (v) => { setSelected(v); setModal('view'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'add') await violationsApi.create(form);
      else await violationsApi.update(selected.ticket_id ?? selected.id, form);
      await load();
      setTimeout(() => { setModal(null); setMsg(''); }, 600);
    } catch (e) { setMsg('Error: ' + (e.response?.data?.message ?? e.message)); }
    setSaving(false);
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete violation record?`)) return;
    try { await violationsApi.delete(v.ticket_id ?? v.id); load(); }
    catch (e) { alert('Delete failed: ' + (e.response?.data?.message ?? e.message)); }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const FormFields = () => (
    <div className="form-grid">
      <div className="form-group">
        <label className="form-label">Violation Type *</label>
        <select className="form-control" name="violation_type" value={form.violation_type} onChange={handleChange}>
          {VIOLATION_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-control" name="violation_status" value={form.violation_status} onChange={handleChange}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Date of Violation *</label>
        <input className="form-control" type="date" name="date_of_violation" value={form.date_of_violation?.split('T')[0] ?? ''} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label className="form-label">Fine Amount (₱)</label>
        <input className="form-control" type="number" name="fine_amount" value={form.fine_amount} onChange={handleChange} placeholder="2000" />
      </div>
      <div className="form-group full">
        <label className="form-label">Location</label>
        <input className="form-control" name="location" value={form.location} onChange={handleChange} placeholder="EDSA, Quezon City" />
      </div>
      <div className="form-group">
        <label className="form-label">Apprehending Officer</label>
        <input className="form-control" name="apprehending_officer" value={form.apprehending_officer} onChange={handleChange} placeholder="PO1 Juan Dela Cruz" />
      </div>
      <div className="form-group">
        <label className="form-label">Driver</label>
        <select className="form-control" name="driver_id" value={form.driver_id} onChange={handleChange}>
          <option value="">— Select Driver —</option>
          {drivers.map(d => <option key={d.license_no} value={d.license_no}>{d.full_name} · {d.license_no}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Vehicle</label>
        <select className="form-control" name="vehicle_id" value={form.vehicle_id} onChange={handleChange}>
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
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
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
                <tr><th>#</th><th>Violation Type</th><th>Driver</th><th>Plate No.</th><th>Date</th><th>Location</th><th>Fine (₱)</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => (
                  <tr key={v.ticket_id ?? i}>
                    <td style={{ color: 'var(--lto-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{v.violation_type}</td>
                    <td style={{ fontSize: 12 }}>{v.driver_name ?? v.full_name ?? '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--lto-blue)', fontSize: 12 }}>{v.plate_number ?? '—'}</td>
                    <td style={{ fontSize: 12 }}>{v.date_of_violation ? new Date(v.date_of_violation).toLocaleDateString('en-PH') : '—'}</td>
                    <td style={{ fontSize: 12 }}>{v.location ?? '—'}</td>
                    <td style={{ fontWeight: 700 }}>₱{Number(v.fine_amount ?? 0).toLocaleString()}</td>
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
          <FormFields />
        </Modal>
      )}

      {modal === 'view' && selected && (
        <Modal title="⚠️ Violation Details" onClose={() => setModal(null)}
          footer={<><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button></>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['Violation Type', selected.violation_type],
              ['Status', selected.violation_status],
              ['Date', selected.date_of_violation ? new Date(selected.date_of_violation).toLocaleDateString('en-PH') : '—'],
              ['Fine Amount', `₱${Number(selected.fine_amount ?? 0).toLocaleString()}`],
              ['Location', selected.location],
              ['Officer', selected.apprehending_officer ?? '—'],
              ['Driver', selected.driver_name ?? selected.full_name ?? '—'],
              ['Vehicle', selected.plate_number ?? '—'],
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
