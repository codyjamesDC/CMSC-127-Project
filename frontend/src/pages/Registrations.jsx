import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { registrationsApi, vehiclesApi } from '../api/client';

const emptyForm = { registration_number: '', vehicle_id: '', registration_date: '', expiration_date: '' };

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

// Helper to compute status based on expiration date
const computeStatus = (expDate) => {
  if (!expDate) return 'suspended';
  const isExpired = new Date(expDate) <= new Date();
  return isExpired ? 'expired' : 'active';
};

export default function Registrations() {
  const [registrations, setRegistrations] = useState([]);
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
      const [rRes, vRes] = await Promise.all([
        registrationsApi.getAll({ registration_status: filterStatus }), 
        vehiclesApi.getAll()
      ]);
      setRegistrations(Array.isArray(rRes.data) ? rRes.data : rRes.data?.data ?? []);
      setVehicles(Array.isArray(vRes.data) ? vRes.data : vRes.data?.data ?? []);
    } catch { setError('Failed to load registrations.'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus]);

  const filtered = registrations.filter(r =>
    // FIXED: Changed r.plate_number to r.plate_no to match the database
    [r.registration_number, r.plate_no, r.vehicle_type].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setForm(emptyForm); setModal('add'); setMsg(''); };
  
  const openEdit = (r) => { 
    // FIXED: Properly map DB names to the frontend form state
    setForm({ 
      registration_number: r.registration_number ?? r.registration_no,
      vehicle_id: r.plate_no ?? '', 
      registration_date: r.registration_date ?? '',
      expiration_date: r.expiration_date ?? ''
    }); 
    setSelected(r); 
    setModal('edit'); 
    setMsg(''); 
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // FIXED: Build the exact payload the Express controller expects
      const payload = {
        registration_number: form.registration_number,
        plate_no: form.vehicle_id, // Map vehicle_id to plate_no
        registration_date: form.registration_date,
        expiration_date: form.expiration_date
      };

      if (modal === 'add') {
        await registrationsApi.create(payload);
      } else {
        await registrationsApi.update(selected.registration_no ?? selected.registration_number, payload);
      }
      
      await load();
      setTimeout(() => { setModal(null); setMsg(''); }, 600);
    } catch (e) { 
      setMsg('Error: ' + (e.response?.data?.message ?? e.message)); 
    }
    setSaving(false);
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete registration "${r.registration_number}"?`)) return;
    try { await registrationsApi.delete(r.registration_no ?? r.registration_number); load(); }
    catch (e) { alert('Delete failed: ' + (e.response?.data?.message ?? e.message)); }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Form Fields extracted so cursor focus isn't lost while typing
  const FormFields = () => (
    <div className="form-grid">
      <div className="form-group full">
        <label className="form-label">Registration Number *</label>
        <input className="form-control" name="registration_number" value={form.registration_number} onChange={handleChange} placeholder="REG-2025-00001" />
      </div>
      {/* Status Dropdown Removed! Status is computed based on expiration date automatically */}
      <div className="form-group full">
        <label className="form-label">Vehicle *</label>
        <select className="form-control" name="vehicle_id" value={form.vehicle_id} onChange={handleChange}>
          <option value="">— Select Vehicle —</option>
          {vehicles.map(v => <option key={v.plate_no} value={v.plate_no}>{v.plate_no} · {v.make} {v.model} ({v.year})</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Registration Date</label>
        <input className="form-control" type="date" name="registration_date" value={form.registration_date?.split('T')[0] ?? ''} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label className="form-label">Expiration Date</label>
        <input className="form-control" type="date" name="expiration_date" value={form.expiration_date?.split('T')[0] ?? ''} onChange={handleChange} />
      </div>
    </div>
  );

  return (
    <div className="page-content fade-in">
      <div className="table-card">
        <div className="table-header">
          <span style={{ fontSize: 20 }}>📋</span>
          <span className="table-header-title">Vehicle Registration Records</span>
          <button className="btn btn-yellow btn-sm" onClick={openAdd}>+ New Registration</button>
        </div>
        <div className="table-toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input placeholder="Search by reg. number, plate, type..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">active</option>
            <option value="expired">expired</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={load}>↺ Refresh</button>
        </div>

        {loading ? (
          <div className="loading"><div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" /></div>
        ) : error ? (
          <div className="alert alert-error" style={{ margin: 16 }}>⚠️ {error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><p>No registrations found.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>#</th><th>Reg. Number</th><th>Plate No.</th><th>Vehicle Type</th><th>Reg. Date</th><th>Expiration</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.registration_id ?? r.registration_no ?? i}>
                    <td style={{ color: 'var(--lto-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{r.registration_number ?? r.registration_no}</td>
                    <td style={{ fontWeight: 600, color: 'var(--lto-blue)' }}>{r.plate_no ?? '—'}</td>
                    <td>{r.vehicle_type ?? '—'}</td>
                    <td style={{ fontSize: 12 }}>{r.registration_date ? new Date(r.registration_date).toLocaleDateString('en-PH') : '—'}</td>
                    <td style={{ fontSize: 12 }}>{r.expiration_date ? new Date(r.expiration_date).toLocaleDateString('en-PH') : '—'}</td>
                    
                    {/* FIXED: Compute status automatically based on expiration date */}
                    <td><StatusBadge status={computeStatus(r.expiration_date)} /></td>
                    
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => openEdit(r)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r)}>Del</button>
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
        <Modal title={modal === 'add' ? '📋 New Registration' : '✏️ Edit Registration'} onClose={() => setModal(null)}
          footer={<>
            {msg && <span style={{ fontSize: 12, color: msg.startsWith('Error') ? 'var(--lto-red)' : 'green', flex: 1 }}>{msg}</span>}
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </>}>
          
          {FormFields()}
          
        </Modal>
      )}
    </div>
  );
}