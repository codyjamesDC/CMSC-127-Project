// frontend/src/pages/Registrations.jsx
import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
// 🛑 MODIFIED: Added violationsApi to check for unpaid tickets
import { registrationsApi, vehiclesApi, violationsApi } from '../api/client';
import { validateForm } from '../utils/validation';
import { showConfirm } from '../utils/confirm';
import { showToast } from '../utils/toast';
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

const formatLocalYYYYMMDD = (dateVal) => {
  if (!dateVal) return '';
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return typeof dateVal === 'string' ? dateVal.split('T')[0] : '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const calculateLTOExpiry = (plate, issueDateStr) => {
  if (!plate || !issueDateStr) return '';
  
  const digits = plate.replace(/\D/g, ''); // Extract only numbers
  const issueDate = new Date(issueDateStr);
  const expiryYear = issueDate.getFullYear() + 1; // Exactly 1 year from issuance year

  // Fallback if plate has no numbers (rare edge case): exactly 1 calendar year
  if (digits.length < 2) {
    return formatLocalYYYYMMDD(new Date(expiryYear, issueDate.getMonth(), issueDate.getDate()));
  }

  const lastDigit = parseInt(digits.slice(-1));
  const secondLastDigit = parseInt(digits.slice(-2, -1));

  // LTO Month Rule (Last Digit): 1=Jan, 2=Feb... 9=Sep, 0=Oct
  const month = lastDigit === 0 ? 9 : lastDigit - 1; // 0-indexed for JS Date

  // LTO Week Rule (2nd to Last Digit)
  let day = 7;
  if (secondLastDigit >= 1 && secondLastDigit <= 3) day = 7;       // 1st Week
  else if (secondLastDigit >= 4 && secondLastDigit <= 6) day = 14; // 2nd Week
  else if (secondLastDigit >= 7 && secondLastDigit <= 8) day = 21; // 3rd Week
  else if (secondLastDigit === 9 || secondLastDigit === 0) day = 28; // 4th Week

  return formatLocalYYYYMMDD(new Date(expiryYear, month, day));
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
  const [errors, setErrors] = useState({});

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
        registration_date: formatLocalYYYYMMDD(r.registration_date),
        expiration_date: formatLocalYYYYMMDD(r.expiration_date),
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

  useEffect(() => {
    if ((modal === 'add' || modal === 'edit') && form.plate_no && form.registration_date) {
      const calcExpiryStr = calculateLTOExpiry(form.plate_no, form.registration_date);
      if (form.expiration_date !== calcExpiryStr) {
        setForm(f => ({ ...f, expiration_date: calcExpiryStr }));
      }
    }
  }, [form.plate_no, form.registration_date, modal]);

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
    const validationErrors = validateForm(form, registrationRules);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setMsg(`Error: ${Object.values(validationErrors)[0]}`);
      const firstField = Object.keys(validationErrors)[0];
      const el = document.getElementById(`reg-${firstField}`) || document.getElementById(firstField);
      if (el && typeof el.focus === 'function') el.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const payload = {
        registration_number: form.registration_number,
        plate_no: form.plate_no,
        registration_date: form.registration_date?.split('T')[0],
        expiration_date: form.expiration_date?.split('T')[0],
      };

      if (modal === 'add') {
        await registrationsApi.create(payload);
      } else {
        await registrationsApi.update(selected.registration_no ?? selected.registration_number, payload);
      }

      await load();
      setModal(null);
      setMsg('');
      setErrors({});
      showToast('Registration saved', 'success', 3000);
    } catch (e) {
      setMsg('Error: ' + (e.response?.data?.message ?? e.message));
    }
    setSaving(false);
  };

  // 🛑 MODIFIED: Made handleRenew async to fetch violations before processing
  const handleRenew = async () => {
    const expiryStr = form.expiration_date?.split('T')[0];
    
    if (!expiryStr) {
      alert("Cannot renew: Expiration date is missing.");
      return;
    }

    // 🛑 NEW: Check for unpaid violations
    try {
      const vioRes = await violationsApi.getAll();
      const tickets = Array.isArray(vioRes.data) ? vioRes.data : vioRes.data?.data ?? [];
      const hasUnpaidVio = tickets.some(t => t.plate_no === form.plate_no && t.violation_status === 'Unpaid');

      if (hasUnpaidVio) {
        alert('Renewal blocked: This vehicle has existing unsettled (Unpaid) violations. Please settle them first.');
        return;
      }
    } catch (e) {
      console.error("Failed to check violations", e);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [expYear, expMonth, expDay] = expiryStr.split('-').map(Number);
    const expiryDate = new Date(expYear, expMonth - 1, expDay);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 60) {
      alert(`Renewal not allowed yet. You can only renew within 2 months (60 days) of your expiration date.\nYour registration still has ${diffDays} days left.`);
      return;
    }

    const newExpiryDate = new Date(expYear + 1, expMonth - 1, expDay);

    setForm(f => ({
      ...f,
      registration_date: formatLocalYYYYMMDD(today), // Update issuance to today
      expiration_date: formatLocalYYYYMMDD(newExpiryDate)
    }));

    alert(`Registration renewal applied!\nNew issuance date: ${formatLocalYYYYMMDD(today)}\nNew expiration date: ${formatLocalYYYYMMDD(newExpiryDate)}\n\nPlease click 'Save' to confirm changes.`);
  };

  const handleDelete = async (r) => {
    const ok = await showConfirm(`Delete registration "${r.registration_number ?? r.registration_no}"? This cannot be undone.`);
    if (!ok) return;
    try { await registrationsApi.delete(r.registration_no ?? r.registration_number); await load(); showToast('Registration deleted', 'success'); }
    catch (e) { showToast('Delete failed: ' + (e.response?.data?.message ?? e.message), 'error'); }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const FormFields = () => (
    <div className="form-grid">
      <div className="form-group full">
        <label htmlFor="reg-registration_number" className="form-label">Registration Number <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="reg-registration_number" className="form-control" name="registration_number" value={form.registration_number} onChange={handleChange} placeholder="REG-2025-00001" disabled={modal === 'edit'} />
      </div>
      <div className="form-group full">
        <label htmlFor="reg-plate_no" className="form-label">Vehicle <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <select id="reg-plate_no" className="form-control" name="plate_no" value={form.plate_no} onChange={handleChange}>
          <option value="">— Select Vehicle —</option>
          {vehicles.map(v => (
            <option key={v.plate_no} value={v.plate_no}>
              {v.plate_no} · {v.make} {v.model} ({v.year})
            </option>
          ))}
        </select>
        {errors.plate_no && <div className="field-error">{errors.plate_no}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="reg-registration_date" className="form-label">Registration Date <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="reg-registration_date" className="form-control" type="date" name="registration_date"
          value={form.registration_date?.split('T')[0] ?? ''}
          max={new Date().toISOString().split('T')[0]}
          onChange={handleChange} />
        {errors.registration_date && <div className="field-error">{errors.registration_date}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="reg-expiration_date" className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Expiration Date <span style={{ color: 'var(--lto-red)' }}>*</span></span>
          {modal === 'edit' && (
            <button type="button" onClick={handleRenew} style={{ background: 'var(--lto-blue)', color: 'white', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 'bold' }}>
              RENEW 1 YR
            </button>
          )}
        </label>
        <input id="reg-expiration_date" className="form-control" type="date" name="expiration_date"
          value={form.expiration_date?.split('T')[0] ?? ''}
          min={form.registration_date?.split('T')[0] || undefined}
          onChange={handleChange} 
          disabled={modal === 'add' || modal === 'edit'} 
        />
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
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
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