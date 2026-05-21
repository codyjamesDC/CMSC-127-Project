// src/pages/Drivers.jsx
import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { driversApi } from '../api/client';
import { validateForm } from '../utils/validation';
import useSortableTable from '../hooks/useSortableTable';
import { showConfirm } from '../utils/confirm';
import { showToast } from '../utils/toast';

const LICENSE_TYPES = ['Student Permit', 'Non-Professional', 'Professional'];
const LICENSE_STATUSES = ['Active', 'Expired', 'Suspended', 'Revoked'];
const SEXES = ['M', 'F'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const EYE_COLORS = ['Brown', 'Black', 'Blue', 'Green', 'Hazel', 'Gray'];

const driverRules = {
  license_no:  { required: true },
  fname:       { required: true },
  lname:       { required: true },
  bday:        { required: true, notFuture: true,
                 msg: 'Birthday cannot be a future date.' },
  sex:         { required: true },
  nationality: { required: true },
  height_cm:   { required: true, type: 'number', msg: 'Height must be a number greater than 0.' },
  weight_kg:   { required: true, type: 'number', msg: 'Weight must be a number greater than 0.' },
  eye_color:   { required: true },
  blood_type:  { required: true },
  contact_no:  { required: true },
  mother_fname:{ required: true },
  mother_lname:{ required: true },
  father_fname:{ required: true },
  father_lname:{ required: true },
  emrg_contact_person: { required: true },
  emrg_contact_no:     { required: true },
  // Cross-field date check (runs only when both fields have a value)
  expiry_date: { afterField: 'issued_date',
                 msg: 'Expiration date must be after the issue date.' },
};

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

const formatLocalYYYYMMDD = (dateVal) => {
  if (!dateVal) return '';
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return typeof dateVal === 'string' ? dateVal.split('T')[0] : '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Mirrors how Registrations.jsx computes status — only overrides 'Active',
// never touches 'Suspended' or 'Revoked'.
const computeLicenseStatus = (driver) => {
  if (driver.license_status?.toLowerCase() === 'active' && driver.expiry_date) {
    return new Date(driver.expiry_date) < new Date() ? 'Expired' : 'Active';
  }
  return driver.license_status;
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
  const [errors, setErrors] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await driversApi.getAll({ license_type: filterType, license_status: filterStatus });
      const rawData = Array.isArray(res.data) ? res.data : res.data?.data ?? [];

      const mappedDrivers = rawData.map(d => {
        const mappedD = {
          ...d,
          bday: formatLocalYYYYMMDD(d.bday),
          issued_date: formatLocalYYYYMMDD(d.issued_date),
          expiry_date: formatLocalYYYYMMDD(d.expiry_date),
          full_name: [d.fname, d.mname, d.lname].filter(Boolean).join(' '),
          addresses: d.addresses || [],
          conditions: d.conditions || [],
          license_codes: d.license_codes || [],
        };
        mappedD.license_status = computeLicenseStatus(mappedD); // auto-expire if past expiry_date
        return mappedD;
      });

      setDrivers(mappedDrivers);
    } catch {
      setError('Failed to load drivers. Check backend connection.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterType, filterStatus]);

  // 🛑 NEW: Added effect to auto-calculate Expiration Date on new driver creation
  useEffect(() => {
    if (modal === 'add' && form.bday && form.issued_date) {
      const [bYear, bMonth, bDay] = form.bday.split('T')[0].split('-').map(Number);
      const [iYear, iMonth, iDay] = form.issued_date.split('T')[0].split('-').map(Number);

      const thisYearsBday = new Date(iYear, bMonth - 1, bDay);
      const issueDateObj = new Date(iYear, iMonth - 1, iDay);

      // Same logic as renewal: if issued strictly before or on birthday this year, add 4 years. If after, add 5 years.
      const expireYear = issueDateObj <= thisYearsBday ? iYear + 4 : iYear + 5;
      const newExpiryDate = new Date(expireYear, bMonth - 1, bDay);
      
      const calcExpiryStr = formatLocalYYYYMMDD(newExpiryDate);

      // Only update if the calculated string is different to prevent infinite loops
      setForm(f => {
        if (f.expiry_date !== calcExpiryStr) {
          return { ...f, expiry_date: calcExpiryStr };
        }
        return f;
      });
    }
  }, [form.bday, form.issued_date, modal]);

  const filtered = drivers.filter(d => {
    const matchesSearch = !search.trim() || [
      d.full_name,
      d.license_no,
      d.addresses.join(' '),
    ].some(field => field?.toLowerCase().includes(search.toLowerCase()));
    const matchesType = !filterType || d.license_type === filterType;
    const matchesStatus = !filterStatus || d.license_status?.toLowerCase() === filterStatus.toLowerCase();;
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

  const handleRenew = () => {
    const bdayStr = form.bday?.split('T')[0];
    const expiryStr = form.expiry_date?.split('T')[0];

    if (!expiryStr) {
      alert("Cannot renew: Current expiration date is missing.");
      return;
    }
    if (!bdayStr) {
      alert("Cannot renew: Date of Birth is required to calculate the new expiration date.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [expYear, expMonth, expDay] = expiryStr.split('-').map(Number);
    const expiryDate = new Date(expYear, expMonth - 1, expDay);

    // Rule 1: Calculate difference in days for the 60-day early renewal limit
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 60) {
      alert(`Renewal is not allowed yet. You can only renew within 60 days of your expiration date.\nYour license still has ${diffDays} days before expiration.`);
      return;
    }

    // Rule 2: Expired for more than 10 years limit
    const tenYearsAgo = new Date(today);
    tenYearsAgo.setFullYear(today.getFullYear() - 10);

    if (expiryDate < tenYearsAgo) {
      alert("Renewal is not allowed. Your license has been expired for more than 10 years.");
      return;
    }

    // Rule 3: Calculate the correct expiration year based on current year and birthday
    const [bYear, bMonth, bDay] = bdayStr.split('-').map(Number);
    const thisYearsBday = new Date(today.getFullYear(), bMonth - 1, bDay);

    let expireYear;
    if (today <= thisYearsBday) {
      // If birthday hasn't passed yet this year (or is today), it counts as year 1
      expireYear = today.getFullYear() + 4;
    } else {
      // If birthday already passed this year
      expireYear = today.getFullYear() + 5;
    }

    const newExpiryDate = new Date(expireYear, bMonth - 1, bDay);

    setForm(f => ({
      ...f,
      issued_date: formatLocalYYYYMMDD(today),
      expiry_date: formatLocalYYYYMMDD(newExpiryDate),
      license_status: 'Active'
    }));

    alert(`License renewal applied!\nNew issue date: ${formatLocalYYYYMMDD(today)}\nNew expiration date: ${formatLocalYYYYMMDD(newExpiryDate)}\n\nPlease click 'Save Driver' to confirm changes.`);
  };

  const handleSave = async () => {
    const validationErrors = validateForm(form, driverRules);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setMsg(`Error: ${Object.values(validationErrors)[0]}`);
      // focus first invalid field if present
      const firstField = Object.keys(validationErrors)[0];
      const el = document.getElementById(`driver-${firstField}`) || document.getElementById(firstField);
      if (el && typeof el.focus === 'function') el.focus();
      return;
    }
    setErrors({});
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

      await load();
      setModal(null);
      setMsg('');
      showToast('Driver record saved successfully', 'success', 3500);
    } catch (e) {
      setMsg('Error: ' + (e.response?.data?.message ?? e.message));
      showToast('Save failed: ' + (e.response?.data?.message ?? e.message), 'error', 4000);
    }
    setSaving(false);
  };

  const handleDelete = async (d) => {
    const ok = await showConfirm(`Delete driver "${d.full_name}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await driversApi.delete(d.license_no);
      await load();
      showToast(`Driver "${d.full_name}" deleted successfully.`, 'success');
    } catch (e) { showToast('Delete failed: ' + (e.response?.data?.message ?? e.message), 'error'); }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const FormFields = () => (
    <div className="form-grid">
      <div className="form-group full">
        <label htmlFor="driver-license_no" className="form-label">License Number <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="driver-license_no" className="form-control" name="license_no" value={form.license_no} onChange={handleChange} placeholder="N01-23-456789" disabled={modal === 'edit'} />
        {errors.license_no && <div className="field-error">{errors.license_no}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="driver-fname" className="form-label">First Name <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="driver-fname" className="form-control" name="fname" value={form.fname} onChange={handleChange} placeholder="Juan" />
        {errors.fname && <div className="field-error">{errors.fname}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="driver-lname" className="form-label">Last Name <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="driver-lname" className="form-control" name="lname" value={form.lname} onChange={handleChange} placeholder="Dela Cruz" />
        {errors.lname && <div className="field-error">{errors.lname}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="driver-mname" className="form-label">Middle Name</label>
        <input id="driver-mname" className="form-control" name="mname" value={form.mname} onChange={handleChange} placeholder="Santos" />
      </div>
      <div className="form-group">
        <label htmlFor="driver-bday" className="form-label">Date of Birth <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="driver-bday" className="form-control" type="date" name="bday"
          value={form.bday?.split('T')[0] ?? ''}
          max={new Date().toISOString().split('T')[0]}
          onChange={handleChange} />
        {errors.bday && <div className="field-error">{errors.bday}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="driver-sex" className="form-label">Sex <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <select id="driver-sex" className="form-control" name="sex" value={form.sex} onChange={handleChange}>
          {SEXES.map(s => <option key={s}>{s}</option>)}
        </select>
        {errors.sex && <div className="field-error">{errors.sex}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="driver-contact_no" className="form-label">Contact No. <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="driver-contact_no" className="form-control" name="contact_no" value={form.contact_no} onChange={handleChange} placeholder="09171234567" />
        {errors.contact_no && <div className="field-error">{errors.contact_no}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="driver-nationality" className="form-label">Nationality <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="driver-nationality" className="form-control" name="nationality" value={form.nationality} onChange={handleChange} placeholder="Filipino" />
        {errors.nationality && <div className="field-error">{errors.nationality}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="driver-height_cm" className="form-label">Height (cm) <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="driver-height_cm" className="form-control" type="number" step="0.01" min="0" name="height_cm" value={form.height_cm} onChange={handleChange} placeholder="170" />
        {errors.height_cm && <div className="field-error">{errors.height_cm}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="driver-weight_kg" className="form-label">Weight (kg) <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="driver-weight_kg" className="form-control" type="number" step="0.01" min="0" name="weight_kg" value={form.weight_kg} onChange={handleChange} placeholder="65" />
        {errors.weight_kg && <div className="field-error">{errors.weight_kg}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="driver-eye_color" className="form-label">Eye Color <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <select id="driver-eye_color" className="form-control" name="eye_color" value={form.eye_color} onChange={handleChange}>
          {EYE_COLORS.map(color => <option key={color}>{color}</option>)}
        </select>
        {errors.eye_color && <div className="field-error">{errors.eye_color}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="driver-blood_type" className="form-label">Blood Type <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <select id="driver-blood_type" className="form-control" name="blood_type" value={form.blood_type} onChange={handleChange}>
          {BLOOD_TYPES.map(type => <option key={type}>{type}</option>)}
        </select>
        {errors.blood_type && <div className="field-error">{errors.blood_type}</div>}
      </div>

      <div className="form-group full">
      <label className="form-label">Mother's Name <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="driver-mother_fname" className="form-control" style={{ flex: 1, minWidth: 0 }} name="mother_fname" value={form.mother_fname} onChange={handleChange} placeholder="Mother First" />
          <input id="driver-mother_mname" className="form-control" style={{ flex: 1, minWidth: 0 }} name="mother_mname" value={form.mother_mname} onChange={handleChange} placeholder="Mother Middle" />
          <input id="driver-mother_lname" className="form-control" style={{ flex: 1, minWidth: 0 }} name="mother_lname" value={form.mother_lname} onChange={handleChange} placeholder="Mother Last" />
        </div>
        {errors.mother_fname && <div className="field-error" style={{ marginTop: 6 }}>{errors.mother_fname}</div>}
      </div>

      <div className="form-group full">
      <label className="form-label">Father's Name <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="driver-father_fname" className="form-control" style={{ flex: 1, minWidth: 0 }} name="father_fname" value={form.father_fname} onChange={handleChange} placeholder="Father First" />
          <input id="driver-father_mname" className="form-control" style={{ flex: 1, minWidth: 0 }} name="father_mname" value={form.father_mname} onChange={handleChange} placeholder="Father Middle" />
          <input id="driver-father_lname" className="form-control" style={{ flex: 1, minWidth: 0 }} name="father_lname" value={form.father_lname} onChange={handleChange} placeholder="Father Last" />
        </div>
        {errors.father_fname && <div className="field-error" style={{ marginTop: 6 }}>{errors.father_fname}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="driver-emrg_contact_person" className="form-label">Emergency Contact Person <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="driver-emrg_contact_person" className="form-control" name="emrg_contact_person" value={form.emrg_contact_person} onChange={handleChange} placeholder="Full name" />
        {errors.emrg_contact_person && <div className="field-error">{errors.emrg_contact_person}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="driver-emrg_contact_no" className="form-label">Emergency Contact No. <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="driver-emrg_contact_no" className="form-control" name="emrg_contact_no" value={form.emrg_contact_no} onChange={handleChange} placeholder="09171234567" />
        {errors.emrg_contact_no && <div className="field-error">{errors.emrg_contact_no}</div>}
      </div>

      <div className="form-group full">
        <label className="form-label">Addresses</label>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addArrayItem('addresses')} style={{ marginBottom: 8 }}>+ Add Address</button>
        {form.addresses.map((addr, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input id={`driver-address-${i}`} className="form-control" style={{ flex: 1, minWidth: 0 }} value={addr} onChange={e => handleArrayChange('addresses', i, e.target.value)} placeholder="Brgy., City, Province" />
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeArrayItem('addresses', i)} aria-label={`Remove Address ${i+1}`}>✕</button>
          </div>
        ))}
      </div>

      <div className="form-group">
        <label className="form-label">Conditions</label>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addArrayItem('conditions')} style={{ marginBottom: 8 }}>+ Add Condition</button>
        {form.conditions.map((cond, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input id={`driver-condition-${i}`} className="form-control" style={{ flex: 1, minWidth: 0 }} value={cond} onChange={e => handleArrayChange('conditions', i, e.target.value)} placeholder="e.g. Wear eyeglasses" />
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeArrayItem('conditions', i)} aria-label={`Remove Condition ${i+1}`}>✕</button>
          </div>
        ))}
      </div>

      <div className="form-group">
        <label className="form-label">License Codes</label>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addArrayItem('license_codes')} style={{ marginBottom: 8 }}>+ Add Code</button>
        {form.license_codes.map((code, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input id={`driver-code-${i}`} className="form-control" style={{ flex: 1, minWidth: 0 }} value={code} onChange={e => handleArrayChange('license_codes', i, e.target.value)} placeholder="e.g. A, B" />
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeArrayItem('license_codes', i)} aria-label={`Remove License Code ${i+1}`}>✕</button>
          </div>
        ))}
      </div>

      <div className="form-group">
        <label className="form-label">License Type</label>
        <select className="form-control" name="license_type" value={form.license_type} onChange={handleChange}>
          {LICENSE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {modal === 'edit' && (
        <div className="form-group">
          <label className="form-label">License Status</label>
          <select className="form-control" name="license_status" value={form.license_status} onChange={handleChange}>
            {LICENSE_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Issue Date <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input className="form-control" type="date" name="issued_date"
          value={form.issued_date?.split('T')[0] ?? ''}
          max={new Date().toISOString().split('T')[0]}
          onChange={handleChange} />
      </div>

      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Expiration Date <span style={{ color: 'var(--lto-red)' }}>*</span> </span>
          {modal === 'edit' && (
            <button type="button" onClick={handleRenew} style={{ background: 'var(--lto-blue)', color: 'white', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 'bold' }}>
              RENEW 5 YRS
            </button>
          )}
        </label>
        <input className="form-control" type="date" name="expiry_date"
          value={form.expiry_date?.split('T')[0] ?? ''}
          min={form.issued_date?.split('T')[0] || undefined}
          onChange={handleChange}
          disabled={modal === 'add'} /* 🛑 NEW: Disabled during 'add' mode to force auto-calculation */
        />
      </div>

      <div className="form-group">
        <label className="form-label">Agency Code</label>
        <input className="form-control" name="agency_code" value={form.agency_code} onChange={handleChange} placeholder="LTO-NCR" />
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
          {sortConfig.key && <button className="btn btn-secondary btn-sm" onClick={resetSort} style={{ color: 'var(--lto-red)' }}>✕ Clear Sort</button>}
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
                  <th>#</th>
                  <SortableHeader label="Full Name" sortKey="full_name"/>
                  <SortableHeader label="License No." sortKey="license_no"/>
                  <SortableHeader label="Type" sortKey="license_type"/>
                  <SortableHeader label="Status" sortKey="license_status"/>
                  <th>Addresses</th>
                  <SortableHeader label="Expiration" sortKey="expiry_date"/>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((d, i) => (
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
            {msg && <span style={{ fontSize: 12, color: msg.startsWith('Error') ? 'var(--lto-red)' : 'green', flex: 1, minWidth: 0 }}>{msg}</span>}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(() => {
              const sections = [
                {
                  title: 'Personal',
                  fields: [
                    ['Full Name', selected.full_name],
                    ['Middle Name', selected.mname || '—'],
                    ['Date of Birth', selected.bday ? new Date(selected.bday).toLocaleDateString('en-PH') : '—'],
                    ['Sex', selected.sex],
                    ['Nationality', selected.nationality],
                    ['Height (cm)', selected.height_cm],
                    ['Weight (kg)', selected.weight_kg],
                    ['Eye Color', selected.eye_color],
                    ['Blood Type', selected.blood_type],
                  ]
                },
                {
                  title: 'Contact',
                  fields: [
                    ['Contact No.', selected.contact_no],
                    ['Emergency Contact Person', selected.emrg_contact_person],
                    ['Emergency Contact No.', selected.emrg_contact_no],
                    ['Mother Name', [selected.mother_fname, selected.mother_mname, selected.mother_lname].filter(Boolean).join(' ')],
                    ['Father Name', [selected.father_fname, selected.father_mname, selected.father_lname].filter(Boolean).join(' ')],
                  ]
                },
                {
                  title: 'License',
                  fields: [
                    ['License No.', selected.license_no],
                    ['License Type', selected.license_type],
                    ['License Status', selected.license_status],
                    ['Issue Date', selected.issued_date ? new Date(selected.issued_date).toLocaleDateString('en-PH') : '—'],
                    ['Expiration Date', selected.expiry_date ? new Date(selected.expiry_date).toLocaleDateString('en-PH') : '—'],
                    ['Agency Code', selected.agency_code],
                  ]
                },
                {
                  title: 'Other',
                  fields: [
                    ['Conditions', selected.conditions?.length ? selected.conditions.join(', ') : 'None'],
                    ['License Codes', selected.license_codes?.length ? selected.license_codes.join(', ') : 'None'],
                    ['Organ Donor', selected.organ_donor ? 'Yes' : 'No'],
                    ['Addresses', selected.addresses?.length ? selected.addresses.join(' | ') : '—'],
                  ]
                }
              ];

              return sections.map(section => (
                <div key={section.title}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--lto-blue)', textTransform: 'uppercase', marginBottom: 8 }}>{section.title}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {section.fields.map(([label, val]) => (
                      <div key={label} style={{ gridColumn: label === 'Addresses' ? '1 / -1' : undefined }}>
                        <div className="form-label" style={{ marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{val || '—'}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', marginTop: 12 }} />
                </div>
              ));
            })()}
          </div>
        </Modal>
      )}
    </div>
  );
}