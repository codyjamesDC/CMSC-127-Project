// frontend/src/pages/Vehicles.jsx
import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { vehiclesApi, driversApi } from '../api/client';
import { validateForm } from '../utils/validation';
import { showConfirm } from '../utils/confirm';
import { showToast } from '../utils/toast';
import useSortableTable from '../hooks/useSortableTable';

const VEHICLE_TYPES = ['Motorcycle', 'Sedan', 'Hatchback', 'SUV', 'Van', 'Truck', 'Bus'];
const OWNERSHIP_TYPES = ['Private', 'For Hire'];

// P0 1.1 FIX: emptyForm uses backend field names (plate_no, engine_no, chassis_no, license_no)
const emptyForm = {
  plate_no: '',
  engine_no: '',
  chassis_no: '',
  vehicle_type: 'Sedan',
  ownership: 'Private',
  make: '',
  model: '',
  year: '',
  color: '',
  license_no: '',
};

const vehicleRules = {
  plate_no: { required: true },
  engine_no: { required: true },
  chassis_no: { required: true },
  license_no: { required: true },
  make: { required: true },
  model: { required: true },
  year: { required: true },
  color: { required: true }
}

// Defined outside component to prevent focus loss on re-render
const FormFields = ({ form, handleChange, drivers, VEHICLE_TYPES, OWNERSHIP_TYPES, errors }) => (
  <div className="form-grid">
    <div className="form-group">
      <label htmlFor="vehicle-plate_no" className="form-label">Plate Number <span style={{ color: 'var(--lto-red)' }}>*</span></label>
      {/* P0 1.1 FIX: name="plate_no" (was plate_number) */}
      <input id="vehicle-plate_no" className="form-control" name="plate_no" value={form.plate_no} onChange={handleChange} placeholder="AAA1234" />
      {errors.plate_no && <div className="field-error">{errors.plate_no}</div>}
    </div>
    <div className="form-group">
      <label className="form-label">Vehicle Type</label>
      <select className="form-control" name="vehicle_type" value={form.vehicle_type} onChange={handleChange}>
        {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
    <div className="form-group">
      <label htmlFor="vehicle-engine_no" className="form-label">Engine Number <span style={{ color: 'var(--lto-red)' }}>*</span></label>
      {/* P0 1.1 FIX: name="engine_no" (was engine_number) */}
      <input id="vehicle-engine_no" className="form-control" name="engine_no" value={form.engine_no} onChange={handleChange} placeholder="ENGINE123" />
      {errors.engine_no && <div className="field-error">{errors.engine_no}</div>}
    </div>
    <div className="form-group">
      <label htmlFor="vehicle-chassis_no" className="form-label">Chassis Number <span style={{ color: 'var(--lto-red)' }}>*</span></label>
      {/* P0 1.1 FIX: name="chassis_no" (was chassis_number) */}
      <input id="vehicle-chassis_no" className="form-control" name="chassis_no" value={form.chassis_no} onChange={handleChange} placeholder="CHASSIS123" />
      {errors.chassis_no && <div className="field-error">{errors.chassis_no}</div>}
    </div>
    <div className="form-group">
      <label className="form-label">Ownership Type</label>
      <select className="form-control" name="ownership" value={form.ownership} onChange={handleChange}>
        {OWNERSHIP_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
    <div className="form-group">
      <label htmlFor="vehicle-make" className="form-label">Make (Brand) <span style={{ color: 'var(--lto-red)' }}>*</span></label>
      <input id="vehicle-make" className="form-control" name="make" value={form.make} onChange={handleChange} placeholder="Toyota" />
      {errors.make && <div className="field-error">{errors.make}</div>}
    </div>
    <div className="form-group">
      <label htmlFor="vehicle-model" className="form-label">Model <span style={{ color: 'var(--lto-red)' }}>*</span></label>
      <input id="vehicle-model" className="form-control" name="model" value={form.model} onChange={handleChange} placeholder="Vios" />
      {errors.model && <div className="field-error">{errors.model}</div>}
    </div>
    <div className="form-group">
      <label htmlFor="vehicle-year" className="form-label">Year <span style={{ color: 'var(--lto-red)' }}>*</span></label>
      <input id="vehicle-year" className="form-control" type="number" name="year" value={form.year} onChange={handleChange} placeholder="2024" min="1900" max="2030" />
      {errors.year && <div className="field-error">{errors.year}</div>}
    </div>
    <div className="form-group">
      <label htmlFor="vehicle-color" className="form-label">Color <span style={{ color: 'var(--lto-red)' }}>*</span></label>
      <input id="vehicle-color" className="form-control" name="color" value={form.color} onChange={handleChange} placeholder="White" />
      {errors.color && <div className="field-error">{errors.color}</div>}
    </div>
    <div className="form-group full">
      <label htmlFor="vehicle-license_no" className="form-label">Registered Owner (Driver) <span style={{ color: 'var(--lto-red)' }}>*</span></label>
      {/* P0 1.1 FIX: name="license_no" (was driver_id) */}
      <select id="vehicle-license_no" className="form-control" name="license_no" value={form.license_no ?? ''} onChange={handleChange}>
        <option value="">— Select Owner —</option>
        {drivers.map(d => (
          <option key={d.license_no} value={d.license_no}>
            {d.full_name} · {d.license_no}
          </option>
        ))}
      {errors.license_no && <div className="field-error">{errors.license_no}</div>}
      </select>
    </div>
  </div>
);

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterOwnership, setFilterOwnership] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [errors, setErrors] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, dRes] = await Promise.all([
        vehiclesApi.getAll({ vehicle_type: filterType, ownership: filterOwnership }),
        driversApi.getAll(),
      ]);

      const rawVehicles = Array.isArray(vRes.data) ? vRes.data : vRes.data?.data ?? [];
      const rawDrivers = Array.isArray(dRes.data) ? dRes.data : dRes.data?.data ?? [];

      const mappedDrivers = rawDrivers.map(d => ({
        ...d,
        full_name: [d.fname, d.mname, d.lname].filter(Boolean).join(' '),
      }));

      const mappedVehicles = rawVehicles.map(v => ({
        ...v,
        // owner_name comes from the JOIN in vehicleQueries.selectAll; fallback to local lookup
        owner_name: v.owner_name ?? mappedDrivers.find(d => d.license_no === v.license_no)?.full_name ?? v.license_no,
      }));

      setVehicles(mappedVehicles);
      setDrivers(mappedDrivers);
    } catch {
      setError('Failed to load vehicles.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterType, filterOwnership]);

  const filtered = vehicles.filter(v =>
    [v.plate_no, v.make, v.model, v.color, v.owner_name].some(f =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const openAdd = () => { setForm(emptyForm); setModal('add'); setMsg(''); };

  const openEdit = (v) => {
    // P0 1.1 FIX: spread v directly — fields are already backend-named (plate_no, engine_no, etc.)
    setForm({
      plate_no: v.plate_no ?? '',
      engine_no: v.engine_no ?? '',
      chassis_no: v.chassis_no ?? '',
      vehicle_type: v.vehicle_type ?? 'Sedan',
      ownership: v.ownership ?? 'Private',
      make: v.make ?? '',
      model: v.model ?? '',
      year: v.year ?? '',
      color: v.color ?? '',
      license_no: v.license_no ?? '',
    });
    setSelected(v);
    setModal('edit');
    setMsg('');
  };

  const openView = (v) => { setSelected(v); setModal('view'); };

  const handleSave = async () => {
    // Validate before proceeding
    const validationErrors = validateForm(form, vehicleRules);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setMsg(`Error: ${Object.values(validationErrors)[0]}`);
      const firstField = Object.keys(validationErrors)[0];
      const el = document.getElementById(`vehicle-${firstField}`) || document.getElementById(firstField);
      if (el && typeof el.focus === 'function') el.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      // P0 1.1 FIX: payload already uses correct backend field names — no remapping needed
      const payload = { ...form };

      if (modal === 'add') {
        await vehiclesApi.create(payload);
      } else {
        await vehiclesApi.update(selected.plate_no, payload);
      }

      await load();
      setModal(null);
      setMsg('');
      showToast('Vehicle saved successfully', 'success', 3000);
    } catch (e) {
      setMsg('Error: ' + (e.response?.data?.message ?? e.message));
    }
    setSaving(false);
  };

  const handleDelete = async (v) => {
    const ok = await showConfirm(`WARNING: Deleting vehicle "${v.plate_no}" will permanently remove all of its associated REGISTRATIONS and TRAFFIC VIOLATION TICKETS.\n\nDo you want to proceed?`);
    if (!ok) return;
    try { await vehiclesApi.delete(v.plate_no); await load(); showToast(`Vehicle ${v.plate_no} deleted.`, 'success'); }
    catch (e) { showToast('Delete failed: ' + (e.response?.data?.message ?? e.message), 'error'); }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

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
          <select className="filter-select" value={filterOwnership} onChange={e => setFilterOwnership(e.target.value)}>
            <option value="">All Ownerships</option>
            {OWNERSHIP_TYPES.map(o => <option key={o}>{o}</option>)}
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
          <div className="empty-state"><div className="empty-state-icon">🚗</div><p>No vehicles found.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {/* 🛑 NEW: Clickable Headers */}
                  <SortableHeader label="Plate No." sortKey="plate_no"/>
                  <SortableHeader label="Type" sortKey="vehicle_type"/>
                  <SortableHeader label="Make / Model" sortKey="make"/>
                  <SortableHeader label="Year" sortKey="year"/>
                  <SortableHeader label="Color" sortKey="color"/>
                  <SortableHeader label="Owner" sortKey="owner_name"/>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* 🛑 NEW: Use sortedItems */}
                {sortedItems.map((v, i) => (
                  <tr key={v.plate_no ?? i}>
                    <td style={{ color: 'var(--lto-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--lto-blue)', fontSize: 13 }}>{v.plate_no}</span></td>
                    <td><span style={{ fontSize: 12, background: 'rgba(0,48,135,0.08)', color: 'var(--lto-blue)', padding: '2px 8px', borderRadius: 4 }}>{v.vehicle_type}</span></td>
                    <td style={{ fontWeight: 500 }}>{v.make} {v.model}</td>
                    <td>{v.year}</td>
                    <td>{v.color}</td>
                    <td style={{ fontSize: 12, color: 'var(--lto-text-muted)' }}>{v.owner_name ?? '—'}</td>
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
        <Modal
          title={modal === 'add' ? '🚗 Register Vehicle' : '✏️ Edit Vehicle'}
          onClose={() => setModal(null)}
          footer={<>
            {msg && <span style={{ fontSize: 12, color: msg.startsWith('Error') ? 'var(--lto-red)' : 'green', flex: 1 }}>{msg}</span>}
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Vehicle'}</button>
          </>}
        >
          <FormFields
            form={form}
            handleChange={handleChange}
            drivers={drivers}
            VEHICLE_TYPES={VEHICLE_TYPES}
            OWNERSHIP_TYPES={OWNERSHIP_TYPES}
            errors={errors}
          />
        </Modal>
      )}

      {modal === 'view' && selected && (
        <Modal title="🚗 Vehicle Details" onClose={() => setModal(null)}
          footer={<><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button></>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['Plate Number', selected.plate_no],
              ['Vehicle Type', selected.vehicle_type],
              ['Engine Number', selected.engine_no],
              ['Chassis Number', selected.chassis_no],
              ['Ownership', selected.ownership],
              ['Make', selected.make],
              ['Model', selected.model],
              ['Year', selected.year],
              ['Color', selected.color],
              ['Registered Owner', selected.owner_name ?? '—'],
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