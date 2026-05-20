// frontend/src/pages/Registrations.jsx
import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { registrationsApi, vehiclesApi } from '../api/client';
import { validateForm } from '../utils/validation';
import useSortableTable from '../hooks/useSortableTable';

const emptyForm = {
  registration_number: '',
  plate_no: '',
  registration_date: '',
  expiration_date: '',
};

const registrationRules = {
  registration_number: { required: true },
  plate_no:            { required: true },
  // Cross-field date check (runs only when both fields have a value)
  expiration_date: { afterField: 'registration_date',
                     msg: 'Expiration date must be after the registration date.' },
};

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

const computeStatus = (expDate) => {
  if (!expDate) return 'suspended';
  return new Date(expDate) <= new Date() ? 'expired' : 'active';
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
        vehiclesApi.getAll(),
      ]);
      
      const rawData = Array.isArray(rRes.data) ? rRes.data : rRes.data?.data ?? [];
      
      setRegistrations(rawData.map(r => ({
        ...r, 
        computed_status: computeStatus(r.expiration_date),
        display_reg: r.registration_number ?? r.registration_no
      })));

      setVehicles(Array.isArray(vRes.data) ? vRes.data : vRes.data?.data ?? []);
    } catch { 
      setError('Failed to load registrations.'); 
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus]);

  const filtered = registrations.filter(r =>
    [r.registration_number ?? r.registration_no, r.plate_no, r.vehicle_type]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setForm(emptyForm); setModal('add'); setMsg(''); };

  const openEdit = (r) => {
    setForm({
      registration_number: r.registration_number ?? r.registration_no ?? '',
      plate_no: r.plate_no ?? '',
      registration_date: r.registration_date ?? '',
      expiration_date: r.expiration_date ?? '',
    });
    setSelected(r);
    setModal('edit');
    setMsg('');
  };

  const handleSave = async () => {
    const errors = validateForm(form, registrationRules);
    if (Object.keys(errors).length > 0) {
      setMsg(`Error: ${Object.values(errors)[0]}`);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        registration_number: form.registration_number,
        plate_no: form.plate_no,
        registration_date: form.registration_date,
        expiration_date: form.expiration_date,
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

  const handleRenew = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() + 5);
    const newExpiry = today.toISOString().split('T')[0];
    setForm(f => ({
      ...f,
      expiration_date: newExpiry
    }));
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete registration "${r.registration_number ?? r.registration_no}"?`)) return;
    try { await registrationsApi.delete(r.registration_no ?? r.registration_number); load(); }
    catch (e) { alert('Delete failed: ' + (e.response?.data?.message ?? e.message)); }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const FormFields = () => (
    <div className="form-grid">
      <div className="form-group full">
        <label className="form-label">Registration Number *</label>
        <input className="form-control" name="registration_number" value={form.registration_number} onChange={handleChange} placeholder="REG-2025-00001" />
      </div>
      <div className="form-group full">
        <label className="form-label">Vehicle *</label>
        <select className="form-control" name="plate_no" value={form.plate_no} onChange={handleChange}>
          <option value="">— Select Vehicle —</option>
          {vehicles.map(v => (
            <option key={v.plate_no} value={v.plate_no}>
              {v.plate_no} · {v.make} {v.model} ({v.year})
            </option>
          ))}
        </select>
      </div>
<div className="form-group">
        <label className="form-label">Registration Date</label>
        <input className="form-control" type="date" name="registration_date"
          value={form.registration_date?.split('T')[0] ?? ''}
          max={new Date().toISOString().split('T')[0]}
          onChange={handleChange} />
      </div>

      <div className="form-group">
        {/* 🛑 NEW: Renew Button inside the label */}
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Expiration Date</span>
          {modal === 'edit' && (
            <button type="button" onClick={handleRenew} style={{ background: 'var(--lto-blue)', color: 'white', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 'bold' }}>
              RENEW 5 YRS
            </button>
          )}
        </label>
        <input className="form-control" type="date" name="expiration_date"
          value={form.expiration_date?.split('T')[0] ?? ''}
          min={form.registration_date?.split('T')[0] || undefined}
          onChange={handleChange} />
      </div>
    </div>
  );

  

  const { sortedItems, requestSort, resetSort, sortConfig, getSortIcon } = useSortableTable(filtered);

  const SortableHeader = ({ label, sortKey }) => (
    <th onClick={() => requestSort(sortKey)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label}{getSortIcon(sortKey)}
    </th>
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
          {/* 🛑 NEW: Clear Sort Button */}
          {sortConfig.key && <button className="btn btn-secondary btn-sm" onClick={resetSort} style={{ color: 'var(--lto-red)' }}>✕ Clear Sort</button>}
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
                <tr>
                  <th>#</th>
                  {/* 🛑 NEW: Clickable Headers */}
                  <SortableHeader label="Reg. Number" sortKey="display_reg"/>
                  <SortableHeader label="Plate No." sortKey="plate_no"/>
                  <SortableHeader label="Vehicle Type" sortKey="vehicle_type"/>
                  <SortableHeader label="Reg. Date" sortKey="registration_date"/>
                  <SortableHeader label="Expiration" sortKey="expiration_date"/>
                  <SortableHeader label="Status" sortKey="computed_status"/>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* 🛑 NEW: Use sortedItems */}
                {sortedItems.map((r, i) => (
                  <tr key={r.display_reg ?? i}>
                    <td style={{ color: 'var(--lto-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{r.display_reg}</td>
                    <td style={{ fontWeight: 600, color: 'var(--lto-blue)' }}>{r.plate_no ?? '—'}</td>
                    <td>{r.vehicle_type ?? '—'}</td>
                    <td style={{ fontSize: 12 }}>{r.registration_date ? new Date(r.registration_date).toLocaleDateString('en-PH') : '—'}</td>
                    <td style={{ fontSize: 12 }}>{r.expiration_date ? new Date(r.expiration_date).toLocaleDateString('en-PH') : '—'}</td>
                    <td><StatusBadge status={r.computed_status} /></td>
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