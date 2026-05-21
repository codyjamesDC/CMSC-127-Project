import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { violationsApi, driversApi, vehiclesApi } from '../api/client';
import { validateForm } from '../utils/validation';
import { showConfirm } from '../utils/confirm';
import { showToast } from '../utils/toast';
import useSortableTable from '../hooks/useSortableTable';

const VIOLATION_TYPES = ['Overspeeding', 'Reckless Driving', 'Illegal Parking', 'Beating Red Light', 'No Helmet', 'No Seatbelt', 'Drunk Driving', 'Illegal Overtaking', 'Obstruction', 'Others'];
const STATUSES = ['Unpaid', 'Paid', 'Contested'];

// MODIFIED: Replaced individual violation fields with an array to support multiple violations
const emptyForm = {
  location: '',
  date: '',
  violation_status: 'Unpaid',
  apprehending_officer: '',
  license_no: '',
  plate_no: '',
  violations: [{ violation_name: 'Overspeeding', fine_amount: '' }],
};

// MODIFIED: Removed violation_type and fine_amount from strict root rules since they are now in an array
const ticketRules = {
  location:             { required: true },
  date:                 { required: true, notFuture: true,
                          msg: 'Violation date cannot be in the future.' },
  apprehending_officer: { required: true },
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
  const [errors, setErrors] = useState({});

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
    // MODIFIED: Map through all violations to allow searching by any violation type in the ticket
    const violationName = v.violations?.map(vi => vi.violation_name).join(', ') || '';
    const driverRef = v.driver_name || v.license_no || '';
    const ticketIdString = v.ticket_id ? `TKT-${String(v.ticket_id).padStart(5, '0')}` : '';

    const matchesSearch = !search.trim() || [
      violationName, v.location, driverRef, v.plate_no, v.apprehending_officer, ticketIdString,
    ].some(f => f?.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = !filterStatus || v.violation_status?.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const openAdd = () => { setForm(emptyForm); setModal('add'); setMsg(''); };

  const openEdit = (v) => {
    setForm({
      location: v.location ?? '',
      date: v.date ?? '',
      violation_status: v.violation_status ?? 'Unpaid',
      apprehending_officer: v.apprehending_officer ?? '',
      license_no: v.license_no ?? '',
      plate_no: v.plate_no ?? '',
      // MODIFIED: Map existing violations to the form state, or fallback to default
      violations: v.violations?.length > 0 
        ? v.violations.map(vi => ({ violation_name: vi.violation_name, fine_amount: vi.fine_amount })) 
        : [{ violation_name: 'Overspeeding', fine_amount: '' }],
    });
    setSelected(v);
    setModal('edit');
    setMsg('');
  };

  const openView = (v) => { setSelected(v); setModal('view'); };

  // NEW: Helper functions to handle dynamic violation rows
  const handleViolationChange = (index, field, value) => {
    const newViolations = [...form.violations];
    newViolations[index][field] = value;
    setForm({ ...form, violations: newViolations });
  };

  const addViolation = () => {
    setForm({ ...form, violations: [...form.violations, { violation_name: 'Overspeeding', fine_amount: '' }] });
  };

  const removeViolation = (index) => {
    const newViolations = [...form.violations];
    newViolations.splice(index, 1);
    setForm({ ...form, violations: newViolations });
  };

  const handleSave = async () => {
    const validationErrors = validateForm(form, ticketRules);
    // Additional presence checks
    if (!form.license_no) validationErrors.license_no = 'Please select a driver.';
    if (!form.plate_no) validationErrors.plate_no = 'Please select a vehicle.';
    if (!form.violations || form.violations.length === 0) validationErrors.violations = 'At least one violation is required.';
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setMsg(`Error: ${Object.values(validationErrors)[0]}`);
      const firstField = Object.keys(validationErrors)[0];
      const el = document.getElementById(`vio-${firstField}`) || document.getElementById(firstField);
      if (el && typeof el.focus === 'function') el.focus();
      return;
    }
    setErrors({});
    
    setSaving(true);
    try {
      // dynamic violations validated above

      const selectedVehicle = vehicles.find(v => v.plate_no === form.plate_no);
      if (!selectedVehicle) { setMsg('Error: Selected vehicle not found.'); setSaving(false); return; }

      // MODIFIED: Manual validation for the dynamic violations array (rows already checked above)
      for (let i = 0; i < form.violations.length; i++) {
        if (!form.violations[i].violation_name) { setMsg(`Error: Violation type is required in row ${i + 1}.`); setSaving(false); return; }
        if (form.violations[i].fine_amount === '' || isNaN(form.violations[i].fine_amount)) { setMsg(`Error: Valid fine amount is required in row ${i + 1}.`); setSaving(false); return; }
      }

      const payload = {
        location: form.location,
        date: form.date,
        violation_status: form.violation_status,
        apprehending_officer: form.apprehending_officer,
        license_no: form.license_no,
        plate_no: selectedVehicle.plate_no,
        engine_no: selectedVehicle.engine_no,
        chassis_no: selectedVehicle.chassis_no,
        // MODIFIED: Pass the array of violations mapped as numbers
        violations: form.violations.map(vi => ({
          violation_name: vi.violation_name,
          fine_amount: Number(vi.fine_amount),
        })),
      };

      if (modal === 'add') {
        await violationsApi.create(payload);
      } else {
        await violationsApi.update(selected.ticket_id, payload);
      }

      await load();
      setModal(null);
      setMsg('');
      setErrors({});
      showToast('Violation saved', 'success', 3000);
    } catch (e) {
      setMsg('Error: ' + (e.response?.data?.message ?? e.message));
    }
    setSaving(false);
  };

  const handleDelete = async (v) => {
    const ok = await showConfirm('Delete violation record? This cannot be undone.');
    if (!ok) return;
    try { await violationsApi.delete(v.ticket_id); await load(); showToast('Violation deleted', 'success'); }
    catch (e) { showToast('Delete failed: ' + (e.response?.data?.message ?? e.message), 'error'); }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const today = new Date().toISOString().split('T')[0];

  const FormFields = () => (
    <div className="form-grid">
      <div className="form-group">
        <label htmlFor="vio-status" className="form-label">Status</label>
        <select id="vio-status" className="form-control" name="violation_status" value={form.violation_status} onChange={handleChange}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="vio-date" className="form-label">Date of Violation <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="vio-date" className="form-control" type="date" name="date"
          value={form.date?.split('T')[0] ?? ''}
          max={today}
          onChange={handleChange} />
        {errors.date && <div className="field-error">{errors.date}</div>}
      </div>
      <div className="form-group full">
        <label htmlFor="vio-location" className="form-label">Location</label>
        <input id="vio-location" className="form-control" name="location" value={form.location} onChange={handleChange} placeholder="EDSA, Quezon City" />
        {errors.location && <div className="field-error">{errors.location}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="vio-officer" className="form-label">Apprehending Officer <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <input id="vio-officer" className="form-control" name="apprehending_officer" value={form.apprehending_officer} onChange={handleChange} placeholder="PO1 Juan Dela Cruz" />
        {errors.apprehending_officer && <div className="field-error">{errors.apprehending_officer}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="vio-driver" className="form-label">Driver <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <select id="vio-driver" className="form-control" name="license_no" value={form.license_no} onChange={handleChange}>
          <option value="">— Select Driver —</option>
        {errors.license_no && <div className="field-error">{errors.license_no}</div>}
          {drivers.map(d => <option key={d.license_no} value={d.license_no}>{d.full_name} · {d.license_no}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="vio-vehicle" className="form-label">Vehicle <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        <select id="vio-vehicle" className="form-control" name="plate_no" value={form.plate_no} onChange={handleChange}>
          <option value="">— Select Vehicle —</option>
        {errors.plate_no && <div className="field-error">{errors.plate_no}</div>}
          {vehicles.map(v => <option key={v.plate_no} value={v.plate_no}>{v.plate_no} · {v.make} {v.model}</option>)}
        </select>
      </div>

      {/* MODIFIED: Dynamic Violations Section */}
      <div className="form-group full">
        <label className="form-label">Violations <span style={{ color: 'var(--lto-red)' }}>*</span></label>
        {form.violations.map((vio, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <select id={`vio-name-${i}`} className="form-control" style={{ flex: 2 }} value={vio.violation_name} onChange={e => handleViolationChange(i, 'violation_name', e.target.value)}>
              {VIOLATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input id={`vio-fine-${i}`} className="form-control" style={{ flex: 1 }} type="number" placeholder="Fine (₱)" value={vio.fine_amount} onChange={e => handleViolationChange(i, 'fine_amount', e.target.value)} />
            {form.violations.length > 1 && (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeViolation(i)} aria-label={`Remove Violation ${i+1}`}>✕</button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={addViolation}>+ Add Violation</button>
      </div>
    </div>
  );

  const { sortedItems, requestSort, resetSort, sortConfig, getSortIcon } = useSortableTable(filtered);

  // Helper for rendering clickable table headers
  const SortableHeader = ({ label, sortKey }) => (
    <th onClick={() => requestSort(sortKey)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label}{getSortIcon(sortKey)}
    </th>
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
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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
          <div className="empty-state"><div className="empty-state-icon">⚠️</div><p>No violations found.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {/* 🛑 NEW: Clickable Headers */}
                  <SortableHeader label="Ticket ID" sortKey="ticket_id"/>
                  <SortableHeader label="Violation Type" sortKey="violation_type"/>
                  <SortableHeader label="Driver" sortKey="driver_name"/>
                  <SortableHeader label="Plate No." sortKey="plate_no"/>
                  <SortableHeader label="Date" sortKey="date"/>
                  <SortableHeader label="Location" sortKey="location"/>
                  <SortableHeader label="Total Fine (₱)" sortKey="fine_amount"/>
                  <SortableHeader label="Status" sortKey="violation_status"/>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* 🛑 NEW: Map over sortedItems instead of filtered */}
                {sortedItems.map((v, i) => (
                  <tr key={v.ticket_id ?? i}>
                    <td style={{ color: 'var(--lto-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--lto-blue)', fontSize: 13 }}>
                        {v.ticket_id ? `TKT-${String(v.ticket_id).padStart(5, '0')}` : '—'}
                      </span>
                    </td>
                    {/* MODIFIED: Join violations array to display multiple violations */}
                    <td style={{ fontWeight: 600 }}>
                      {v.violations?.map(vi => vi.violation_name).join(', ') || '—'}
                    </td>
                    <td style={{ fontSize: 12 }}>{v.driver_name ?? v.license_no ?? '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--lto-blue)', fontSize: 12 }}>{v.plate_no ?? '—'}</td>
                    <td style={{ fontSize: 12 }}>{v.date ? new Date(v.date).toLocaleDateString('en-PH') : '—'}</td>
                    <td style={{ fontSize: 12 }}>{v.location ?? '—'}</td>
                    {/* MODIFIED: Reduce violations array to calculate sum total fine */}
                    <td style={{ fontWeight: 700 }}>
                      ₱{v.violations?.reduce((sum, vi) => sum + Number(vi.fine_amount || 0), 0).toLocaleString()}
                    </td>
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
              /* MODIFIED: Display multiple violations in view modal */
              ['Violation(s)', selected.violations?.map(vi => vi.violation_name).join(', ') || '—'],
              ['Status', selected.violation_status],
              ['Date', selected.date ? new Date(selected.date).toLocaleDateString('en-PH') : '—'],
              /* MODIFIED: Display sum total fine in view modal */
              ['Total Fine', `₱${selected.violations?.reduce((sum, vi) => sum + Number(vi.fine_amount || 0), 0).toLocaleString()}`],
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