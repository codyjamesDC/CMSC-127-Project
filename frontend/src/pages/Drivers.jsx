import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { driversApi } from '../api/client';

const LICENSE_TYPES = ['Student Permit', 'Non-Professional', 'Professional'];
const LICENSE_STATUSES = ['valid', 'expired', 'suspended', 'revoked'];
const SEXES = ['Male', 'Female'];

const emptyForm = {
  full_name: '', date_of_birth: '', sex: 'Male', address: '',
  license_number: '', license_type: 'Non-Professional',
  license_status: 'valid', issue_date: '', expiration_date: '',
};

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'view'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
  try {
    const res = await driversApi.getAll({ license_type: filterType, license_status: filterStatus });
    const rawData = Array.isArray(res.data) ? res.data : res.data?.data ?? [];

    // ADDED: Map database fields to frontend fields 
    const mappedDrivers = rawData.map(d => ({
      ...d,
      full_name: `${d.fname} ${d.mname ? d.mname + ' ' : ''}${d.lname}`, // Combines fname, mname, lname 
      // MAPPING DATABASE FIELDS TO FRONTEND NAMES
      license_number: d.license_no, 
      date_of_birth: d.bday,        // Maps 'bday' to 'date_of_birth'
      issue_date: d.issued_date,    // Maps 'issued_date' to 'issue_date'
      expiration_date: d.expiry_date, 
      
      // Since address is in a supporting table, ensure your backend join 
      // returns it, or map it here if it's currently undefined
      address: d.address || '—' 
    }));

    setDrivers(mappedDrivers);
  } catch { 
    setError('Failed to load drivers. Check backend connection.'); 
  }
  setLoading(false);
};

  useEffect(() => { load(); }, [filterType, filterStatus]);

  const filtered = drivers.filter(d => {
  // If search is empty or just spaces, show all driver information
  if (!search || !search.trim()) return true; 

  const term = search.toLowerCase();
  // Matching fields against your specific database schema
  // Note: 'fname' and 'lname' from schema are concatenated as 'full_name' in the frontend
  return (
    d.full_name?.toLowerCase().includes(term) ||
    d.license_number?.toLowerCase().includes(term) ||
    d.address?.toLowerCase().includes(term)
  );
});

  const openAdd = () => { setForm(emptyForm); setModal('add'); setMsg(''); };
  const openEdit = (d) => { setForm({ ...d }); setSelected(d); setModal('edit'); setMsg(''); };
  const openView = (d) => { setSelected(d); setModal('view'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'add') await driversApi.create(form);
      else await driversApi.update(selected.license_no, form);
      setMsg('Saved successfully.');
      await load();
      setTimeout(() => { setModal(null); setMsg(''); }, 800);
    } catch (e) {
      setMsg('Error: ' + (e.response?.data?.message ?? e.message));
    }
    setSaving(false);
  };

  const handleDelete = async (d) => {
    if (!window.confirm(`Delete driver "${d.full_name}"? This cannot be undone.`)) return;
    try {
      await driversApi.delete(d.license_no);
      load();
    } catch (e) { alert('Delete failed: ' + (e.response?.data?.message ?? e.message)); }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="page-content fade-in">
      <div className="table-card">
        <div className="table-header">
          <span style={{ fontSize: 20 }}>👤</span>
          <span className="table-header-title">Driver Records</span>
          <button className="btn btn-yellow btn-sm" onClick={openAdd}>+ Add Driver</button>
        </div>

        <div className="table-toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input placeholder="Search by name, license no., address..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All License Types</option>
            {LICENSE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {LICENSE_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={load}>↺ Refresh</button>
        </div>

        {loading ? (
          <div className="loading"><div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" /></div>
        ) : error ? (
          <div className="alert alert-error" style={{ margin: 16 }}>⚠️ {error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">👤</div><p>No drivers found.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Full Name</th><th>License No.</th><th>Type</th><th>Status</th><th>Sex</th><th>Expiration</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.license_no ?? i}>
                    <td style={{ color: 'var(--lto-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{d.full_name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{d.license_number}</td>
                    <td><span style={{ fontSize: 12, background: 'rgba(0,48,135,0.08)', color: 'var(--lto-blue)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{d.license_type}</span></td>
                    <td><StatusBadge status={d.license_status} /></td>
                    <td>{d.sex}</td>
                    <td style={{ fontSize: 12 }}>{d.expiration_date ? new Date(d.expiration_date).toLocaleDateString('en-PH') : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openView(d)}>View</button>
                        <button className="btn btn-primary btn-sm" onClick={() => openEdit(d)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal
          title={modal === 'add' ? '👤 Add New Driver' : '✏️ Edit Driver'}
          onClose={() => setModal(null)}
          footer={<>
            {msg && <span style={{ fontSize: 12, color: msg.startsWith('Error') ? 'var(--lto-red)' : 'green', flex: 1 }}>{msg}</span>}
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Driver'}</button>
          </>}
        >
          <div className="form-grid">
            <div className="form-group full">
              <label className="form-label">Full Name *</label>
              <input className="form-control" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Juan Dela Cruz" />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth *</label>
              <input className="form-control" type="date" name="date_of_birth" value={form.date_of_birth?.split('T')[0] ?? ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Sex</label>
              <select className="form-control" name="sex" value={form.sex} onChange={handleChange}>
                {SEXES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label className="form-label">Address</label>
              <input className="form-control" name="address" value={form.address} onChange={handleChange} placeholder="Brgy., City, Province" />
            </div>
            <div className="form-group">
              <label className="form-label">License Number *</label>
              <input className="form-control" name="license_number" value={form.license_number} onChange={handleChange} placeholder="N01-23-456789" />
            </div>
            <div className="form-group">
              <label className="form-label">License Type</label>
              <select className="form-control" name="license_type" value={form.license_type} onChange={handleChange}>
                {LICENSE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">License Status</label>
              <select className="form-control" name="license_status" value={form.license_status} onChange={handleChange}>
                {LICENSE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Issue Date</label>
              <input className="form-control" type="date" name="issue_date" value={form.issue_date?.split('T')[0] ?? ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Expiration Date</label>
              <input className="form-control" type="date" name="expiration_date" value={form.expiration_date?.split('T')[0] ?? ''} onChange={handleChange} />
            </div>
          </div>
        </Modal>
      )}

      {/* VIEW MODAL */}
      {modal === 'view' && selected && (
        <Modal title="👤 Driver Details" onClose={() => setModal(null)}
          footer={<><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button></>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['Full Name', selected.full_name],
              ['License No.', selected.license_number],
              ['Date of Birth', selected.date_of_birth ? new Date(selected.date_of_birth).toLocaleDateString('en-PH') : '—'],
              ['Sex', selected.sex],
              ['License Type', selected.license_type],
              ['License Status', selected.license_status],
              ['Issue Date', selected.issue_date ? new Date(selected.issue_date).toLocaleDateString('en-PH') : '—'],
              ['Expiration Date', selected.expiration_date ? new Date(selected.expiration_date).toLocaleDateString('en-PH') : '—'],
              ['Address', selected.address],
            ].map(([label, val]) => (
              <div key={label} style={{ gridColumn: label === 'Address' ? '1 / -1' : undefined }}>
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
