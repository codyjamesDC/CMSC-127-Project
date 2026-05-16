import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { vehiclesApi, driversApi } from '../api/client';

const VEHICLE_TYPES = ['Motorcycle', 'Private Car', 'Public Utility Vehicle', 'Truck', 'Bus', 'SUV', 'Van'];
const emptyForm = { plate_number: '', engine_number: '', chassis_number: '', vehicle_type: 'Private Car', make: '', model: '', year: '', color: '', driver_id: '' };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, dRes] = await Promise.all([vehiclesApi.getAll({ vehicle_type: filterType }), driversApi.getAll()]);
      setVehicles(Array.isArray(vRes.data) ? vRes.data : vRes.data?.data ?? []);
      setDrivers(Array.isArray(dRes.data) ? dRes.data : dRes.data?.data ?? []);
    } catch { setError('Failed to load vehicles.'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterType]);

  const filtered = vehicles.filter(v =>
    [v.plate_number, v.make, v.model, v.color, v.owner_name].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setForm(emptyForm); setModal('add'); setMsg(''); };
  const openEdit = (v) => { setForm({ ...v, license_no: v.license_no ?? '' }); setSelected(v); setModal('edit'); setMsg(''); };
  const openView = (v) => { setSelected(v); setModal('view'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'add') await vehiclesApi.create(form);
      else await vehiclesApi.update(selected.plate_no, form);
      await load();
      setTimeout(() => { setModal(null); setMsg(''); }, 600);
    } catch (e) { setMsg('Error: ' + (e.response?.data?.message ?? e.message)); }
    setSaving(false);
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete vehicle "${v.plate_number}"?`)) return;
    try { await vehiclesApi.delete(v.plate_no); load(); }
    catch (e) { alert('Delete failed: ' + (e.response?.data?.message ?? e.message)); }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const FormFields = () => (
    <div className="form-grid">
      <div className="form-group">
        <label className="form-label">Plate Number *</label>
        <input className="form-control" name="plate_number" value={form.plate_number} onChange={handleChange} placeholder="AAA 1234" />
      </div>
      <div className="form-group">
        <label className="form-label">Vehicle Type</label>
        <select className="form-control" name="vehicle_type" value={form.vehicle_type} onChange={handleChange}>
          {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Engine Number</label>
        <input className="form-control" name="engine_number" value={form.engine_number} onChange={handleChange} placeholder="ENGINE123" />
      </div>
      <div className="form-group">
        <label className="form-label">Chassis Number</label>
        <input className="form-control" name="chassis_number" value={form.chassis_number} onChange={handleChange} placeholder="CHASSIS123" />
      </div>
      <div className="form-group">
        <label className="form-label">Make (Brand)</label>
        <input className="form-control" name="make" value={form.make} onChange={handleChange} placeholder="Toyota" />
      </div>
      <div className="form-group">
        <label className="form-label">Model</label>
        <input className="form-control" name="model" value={form.model} onChange={handleChange} placeholder="Vios" />
      </div>
      <div className="form-group">
        <label className="form-label">Year</label>
        <input className="form-control" type="number" name="year" value={form.year} onChange={handleChange} placeholder="2024" min="1900" max="2030" />
      </div>
      <div className="form-group">
        <label className="form-label">Color</label>
        <input className="form-control" name="color" value={form.color} onChange={handleChange} placeholder="White" />
      </div>
      <div className="form-group full">
        <label className="form-label">Registered Owner (Driver)</label>
        <select className="form-control" name="license_no" value={form.license_no ?? ''} onChange={handleChange}>
          <option value="">— Select Owner —</option>
          {drivers.map(d => <option key={d.license_no} value={d.license_no}>{d.full_name} · {d.license_no}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div className="page-content fade-in">
      <div className="table-card">
        <div className="table-header">
          <span style={{ fontSize: 20 }}>🚗</span>
          <span className="table-header-title">Vehicle Records</span>
          <button className="btn btn-yellow btn-sm" onClick={openAdd}>+ Register Vehicle</button>
        </div>
        <div className="table-toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input placeholder="Search by plate, make, model, color, owner..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={load}>↺ Refresh</button>
        </div>

        {loading ? (
          <div className="loading"><div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" /></div>
        ) : error ? (
          <div className="alert alert-error" style={{ margin: 16 }}>⚠️ {error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🚗</div><p>No vehicles found.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>#</th><th>Plate No.</th><th>Type</th><th>Make / Model</th><th>Year</th><th>Color</th><th>Owner</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => (
                  <tr key={v.plate_no ?? i}>
                    <td style={{ color: 'var(--lto-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--lto-blue)', fontSize: 13 }}>{v.plate_number}</span></td>
                    <td><span style={{ fontSize: 12, background: 'rgba(0,48,135,0.08)', color: 'var(--lto-blue)', padding: '2px 8px', borderRadius: 4 }}>{v.vehicle_type}</span></td>
                    <td style={{ fontWeight: 500 }}>{v.make} {v.model}</td>
                    <td>{v.year}</td>
                    <td>{v.color}</td>
                    <td style={{ fontSize: 12, color: 'var(--lto-text-muted)' }}>{v.owner_name ?? v.full_name ?? v.license_no ?? '—'}</td>
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
        <Modal title={modal === 'add' ? '🚗 Register Vehicle' : '✏️ Edit Vehicle'} onClose={() => setModal(null)}
          footer={<>
            {msg && <span style={{ fontSize: 12, color: msg.startsWith('Error') ? 'var(--lto-red)' : 'green', flex: 1 }}>{msg}</span>}
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Vehicle'}</button>
          </>}>
          <FormFields />
        </Modal>
      )}

      {modal === 'view' && selected && (
        <Modal title="🚗 Vehicle Details" onClose={() => setModal(null)}
          footer={<><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button></>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['Plate Number', selected.plate_number],
              ['Vehicle Type', selected.vehicle_type],
              ['Engine Number', selected.engine_number],
              ['Chassis Number', selected.chassis_number],
              ['Make', selected.make],
              ['Model', selected.model],
              ['Year', selected.year],
              ['Color', selected.color],
              ['Registered Owner', selected.owner_name ?? selected.full_name ?? '—'],
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
