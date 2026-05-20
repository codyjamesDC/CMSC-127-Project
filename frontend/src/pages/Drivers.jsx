import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { driversApi } from '../api/client';

const LICENSE_TYPES = ['Student Permit', 'Non-Professional', 'Professional'];
const LICENSE_STATUSES = ['Active', 'Expired', 'Suspended', 'Revoked'];
const SEXES = ['M', 'F'];

const emptyForm = {
  license_no: '',
  fname: '',
  lname: '',
  mname: '',
  bday: '',
  sex: 'M',
  nationality: 'Filipino',
  height_cm: '',
  weight_kg: '',
  eye_color: 'Brown',
  blood_type: 'O+',
  contact_no: '',
  organ_donor: 0,
  mother_fname: '',
  mother_lname: '',
  mother_mname: '',
  father_fname: '',
  father_lname: '',
  father_mname: '',
  emrg_contact_person: '',
  emrg_contact_no: '',
  license_type: 'Non-Professional',
  license_status: 'Active', 
  issued_date: '',
  expiry_date: '',
  agency_code: '',
  conditions: [],
  license_codes: [],
  addresses: [],
};

function StatusBadge({ status }) {
  return <span className={`badge badge-${status?.toLowerCase()}`}>{status}</span>;
}

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await driversApi.getAll({ license_type: filterType, license_status: filterStatus });
      const rawData = Array.isArray(res.data) ? res.data : res.data?.data ?? [];

      const mappedDrivers = rawData.map(d => ({
        ...d,
        full_name: [d.fname, d.mname, d.lname].filter(Boolean).join(' '),
        addresses: d.addresses || [],
        conditions: d.conditions || [],
        license_codes: d.license_codes || [],
      }));

      setDrivers(mappedDrivers);
    } catch {
      setError('Failed to load drivers. Check backend connection.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterType, filterStatus]);

  const filtered = drivers.filter(d => {
    const matchesSearch = !search.trim() || [
      d.full_name,
      d.license_no,
      d.addresses.join(' '),
    ].some(field => field?.toLowerCase().includes(search.toLowerCase()));
    const matchesType = !filterType || d.license_type === filterType;
    const matchesStatus = !filterStatus || d.license_status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const openAdd = () => { setForm(emptyForm); setModal('add'); setMsg(''); };

  const openEdit = (d) => {
    setForm({
      ...d,
      addresses: d.addresses?.length ? d.addresses : [],
      conditions: d.conditions || [],
      license_codes: d.license_codes || [],
    });
    setSelected(d);
    setModal('edit');
    setMsg('');
  };

  const openView = (d) => { setSelected(d); setModal('view'); };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...form[field]];
    newArray[index] = value;
    setForm({ ...form, [field]: newArray });
  };
  const addArrayItem = (field) => setForm({ ...form, [field]: [...form[field], ''] });
  const removeArrayItem = (field, index) => {
    const newArray = [...form[field]];
    newArray.splice(index, 1);
    setForm({ ...form, [field]: newArray });
  };

  // 🛑 NEW FUNCTION: Handles the Renew button logic
  const handleRenew = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() + 5);
    const newExpiry = today.toISOString().split('T')[0];
    
    setForm(f => ({
      ...f,
      expiry_date: newExpiry,
      license_status: 'Active'
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        bday: form.bday?.split('T')[0],
        issued_date: form.issued_date?.split('T')[0],
        expiry_date: form.expiry_date?.split('T')[0],
        addresses: form.addresses.filter(a => a.trim() !== ''),
        conditions: form.conditions.filter(c => c.trim() !== ''),
        license_codes: form.license_codes.filter(lc => lc.trim() !== ''),
      };

      if (modal === 'add') {
        await driversApi.create(payload);
      } else {
        await driversApi.update(selected.license_no, payload);
      }

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

  const FormFields = () => (
    <div className="form-grid">
      <div className="form-group full">
        <label className="form-label">License Number *</label>
        <input className="form-control" name="license_no" value={form.license_no} onChange={handleChange} placeholder="N01-23-456789" />
      </div>
      <div className="form-group">
        <label className="form-label">First Name *</label>
        <input className="form-control" name="fname" value={form.fname} onChange={handleChange} placeholder="Juan" />
      </div>
      <div className="form-group">
        <label className="form-label">Last Name *</label>
        <input className="form-control" name="lname" value={form.lname} onChange={handleChange} placeholder="Dela Cruz" />
      </div>
      <div className="form-group">
        <label className="form-label">Middle Name</label>
        <input className="form-control" name="mname" value={form.mname} onChange={handleChange} placeholder="Santos" />
      </div>
      <div className="form-group">
        <label className="form-label">Date of Birth *</label>
        <input className="form-control" type="date" name="bday" value={form.bday?.split('T')[0] ?? ''} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label className="form-label">Sex</label>
        <select className="form-control" name="sex" value={form.sex} onChange={handleChange}>
          {SEXES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Contact No.</label>
        <input className="form-control" name="contact_no" value={form.contact_no} onChange={handleChange} placeholder="09171234567" />
      </div>

      <div className="form-group full" style={{ background: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 8 }}>
        <label className="form-label">Addresses</label>
        {form.addresses.map((addr, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="form-control" value={addr} onChange={e => handleArrayChange('addresses', i, e.target.value)} placeholder="Brgy., City, Province" />
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeArrayItem('addresses', i)}>✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addArrayItem('addresses')}>+ Add Address</button>
      </div>

      <div className="form-group" style={{ background: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 8 }}>
        <label className="form-label">Conditions</label>
        {form.conditions.map((cond, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="form-control" value={cond} onChange={e => handleArrayChange('conditions', i, e.target.value)} placeholder="e.g. Wear eyeglasses" />
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeArrayItem('conditions', i)}>✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addArrayItem('conditions')}>+ Add Condition</button>
      </div>

      <div className="form-group" style={{ background: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 8 }}>
        <label className="form-label">License Codes</label>
        {form.license_codes.map((code, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="form-control" value={code} onChange={e => handleArrayChange('license_codes', i, e.target.value)} placeholder="e.g. A, B" />
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeArrayItem('license_codes', i)}>✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addArrayItem('license_codes')}>+ Add Code</button>
      </div>

      <div className="form-group">
        <label className="form-label">License Type</label>
        <select className="form-control" name="license_type" value={form.license_type} onChange={handleChange}>
          {LICENSE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* 🛑 CONDITIONAL RENDERING: Only show License Status when editing an existing driver */}
      {modal === 'edit' && (
        <div className="form-group">
          <label className="form-label">License Status</label>
          <select className="form-control" name="license_status" value={form.license_status} onChange={handleChange}>
            {LICENSE_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Issue Date</label>
        <input className="form-control" type="date" name="issued_date" value={form.issued_date?.split('T')[0] ?? ''} onChange={handleChange} />
      </div>

      <div className="form-group">
        {/* 🛑 NEW RENEW BUTTON: Rendered right next to the Expiration Date label */}
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Expiration Date</span>
          {modal === 'edit' && (
            <button type="button" onClick={handleRenew} style={{ background: 'var(--lto-blue)', color: 'white', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 'bold' }}>
              RENEW 5 YRS
            </button>
          )}
        </label>
        <input className="form-control" type="date" name="expiry_date" value={form.expiry_date?.split('T')[0] ?? ''} onChange={handleChange} />
      </div>
      
      <div className="form-group">
        <label className="form-label">Agency Code</label>
        <input className="form-control" name="agency_code" value={form.agency_code} onChange={handleChange} placeholder="LTO-NCR" />
      </div>
    </div>
  );

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
                  <th>#</th><th>Full Name</th><th>License No.</th><th>Type</th><th>Status</th><th>Addresses</th><th>Expiration</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.license_no ?? i}>
                    <td style={{ color: 'var(--lto-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{d.full_name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{d.license_no}</td>
                    <td><span style={{ fontSize: 12, background: 'rgba(0,48,135,0.08)', color: 'var(--lto-blue)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{d.license_type}</span></td>
                    <td><StatusBadge status={d.license_status} /></td>
                    <td style={{ fontSize: 12 }}>
                      {d.addresses.length > 0 ? (
                        <>
                          {d.addresses[0]}
                          {d.addresses.length > 1 && <span style={{ color: 'var(--lto-blue)', fontWeight: 'bold' }}> (+{d.addresses.length - 1})</span>}
                        </>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 12 }}>{d.expiry_date ? new Date(d.expiry_date).toLocaleDateString('en-PH') : '—'}</td>
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
          {FormFields()}
        </Modal>
      )}

      {modal === 'view' && selected && (
        <Modal title="👤 Driver Details" onClose={() => setModal(null)}
          footer={<><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button></>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['Full Name', selected.full_name],
              ['License No.', selected.license_no],
              ['Date of Birth', selected.bday ? new Date(selected.bday).toLocaleDateString('en-PH') : '—'],
              ['Sex', selected.sex],
              ['License Type', selected.license_type],
              ['License Status', selected.license_status],
              ['Issue Date', selected.issued_date ? new Date(selected.issued_date).toLocaleDateString('en-PH') : '—'],
              ['Expiration Date', selected.expiry_date ? new Date(selected.expiry_date).toLocaleDateString('en-PH') : '—'],
              ['Conditions', selected.conditions?.length ? selected.conditions.join(', ') : 'None'],
              ['License Codes', selected.license_codes?.length ? selected.license_codes.join(', ') : 'None'],
              ['Addresses', selected.addresses?.length ? selected.addresses.join(' | ') : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ gridColumn: label === 'Addresses' ? '1 / -1' : undefined }}>
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