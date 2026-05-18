import { useState } from 'react';
import { reportsApi } from '../api/client';

const LICENSE_TYPES = ['', 'Student Permit', 'Non-Professional', 'Professional'];
const LICENSE_STATUSES = ['', 'Active', 'Expired', 'Suspended'];
const SEXES = ['', 'M', 'F'];

function ReportTable({ data, loading, error }) {
  if (loading) return <div className="loading"><div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" /></div>;
  if (error) return <div className="alert alert-error">⚠️ {error}</div>;
  if (!data) return null;
  if (data.length === 0) return <div className="empty-state"><div className="empty-state-icon">📊</div><p>No results found.</p></div>;

  const cols = Object.keys(data[0]);
  return (
    <div style={{ overflowX: 'auto', marginTop: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--lto-text-muted)', marginBottom: 8 }}>{data.length} record{data.length !== 1 ? 's' : ''} found</div>
      <table>
        <thead>
          <tr>{cols.map(c => <th key={c}>{c.replace(/_/g, ' ')}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {cols.map(c => (
                <td key={c}>
                  {c.includes('date') || c.includes('Date')
                    ? (row[c] ? new Date(row[c]).toLocaleDateString('en-PH') : '—')
                    : c.includes('amount') || c.includes('fine')
                    ? `₱${Number(row[c] ?? 0).toLocaleString()}`
                    : row[c] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportSection({ title, icon, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="table-card" style={{ marginBottom: 16 }}>
      <div className="table-header" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span className="table-header-title">{title}</span>
        <span style={{ color: '#fff', fontSize: 18, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </div>
      {open && <div style={{ padding: '20px' }}>{children}</div>}
    </div>
  );
}

export default function Reports() {
  // Report 1: Drivers by filter
  const [r1Params, setR1Params] = useState({ license_type: '', license_status: '', sex: '', age_min: '', age_max: '' });
  const [r1, setR1] = useState(null); const [r1L, setR1L] = useState(false); const [r1E, setR1E] = useState('');

  // Report 2: Vehicles by driver
  const [r2DriverId, setR2DriverId] = useState('');
  const [r2, setR2] = useState(null); const [r2L, setR2L] = useState(false); const [r2E, setR2E] = useState('');

  // Report 3: Expired registrations
  const [r3Date, setR3Date] = useState(new Date().toISOString().split('T')[0]);
  const [r3, setR3] = useState(null); const [r3L, setR3L] = useState(false); const [r3E, setR3E] = useState('');

  // Report 4: Expired/suspended licenses
  const [r4, setR4] = useState(null); const [r4L, setR4L] = useState(false); const [r4E, setR4E] = useState('');

  // Report 5: Violations by driver & date
  const [r5DriverId, setR5DriverId] = useState(''); const [r5From, setR5From] = useState(''); const [r5To, setR5To] = useState('');
  const [r5, setR5] = useState(null); const [r5L, setR5L] = useState(false); const [r5E, setR5E] = useState('');

  // Report 6: Violations by type per year
  const [r6Year, setR6Year] = useState(new Date().getFullYear().toString());
  const [r6, setR6] = useState(null); const [r6L, setR6L] = useState(false); const [r6E, setR6E] = useState('');

  // Report 7: Vehicles in violations by location
  const [r7Location, setR7Location] = useState('');
  const [r7, setR7] = useState(null); const [r7L, setR7L] = useState(false); const [r7E, setR7E] = useState('');

  const run = async (fn, setData, setLoading, setError) => {
    setLoading(true); setError(''); setData(null);
    try { const res = await fn(); setData(Array.isArray(res.data) ? res.data : res.data?.data ?? []); }
    catch (e) { setError(e.response?.data?.message ?? e.message); }
    setLoading(false);
  };

  return (
    <div className="page-content fade-in">
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        📊 SQL-based reports are generated live from your database. Expand a section and run the query.
      </div>

      {/* R1 */}
      <ReportSection title="Drivers Filtered by License Type / Status / Age / Sex" icon="👤">
        <div className="filter-bar" style={{ marginBottom: 12 }}>
          <select className="filter-select" value={r1Params.license_type} onChange={e => setR1Params(p => ({ ...p, license_type: e.target.value }))}>
            {LICENSE_TYPES.map(t => <option key={t} value={t}>{t || 'All License Types'}</option>)}
          </select>
          <select className="filter-select" value={r1Params.license_status} onChange={e => setR1Params(p => ({ ...p, license_status: e.target.value }))}>
            {LICENSE_STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <select className="filter-select" value={r1Params.sex} onChange={e => setR1Params(p => ({ ...p, sex: e.target.value }))}>
            <option value="">All Sexes</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
          <input className="filter-select" type="number" placeholder="Min Age" value={r1Params.age_min} onChange={e => setR1Params(p => ({ ...p, age_min: e.target.value }))} style={{ width: 90 }} />
          <input className="filter-select" type="number" placeholder="Max Age" value={r1Params.age_max} onChange={e => setR1Params(p => ({ ...p, age_max: e.target.value }))} style={{ width: 90 }} />
          <button className="btn btn-primary btn-sm" onClick={() => run(() => reportsApi.driversByFilter(r1Params), setR1, setR1L, setR1E)}>▶ Run</button>
        </div>
        <ReportTable data={r1} loading={r1L} error={r1E} />
      </ReportSection>

      {/* R2 */}
      <ReportSection title="Vehicles Owned by a Given Driver" icon="🚗">
        <div className="filter-bar" style={{ marginBottom: 12 }}>
          <input className="filter-select" placeholder="Driver ID" value={r2DriverId} onChange={e => setR2DriverId(e.target.value)} style={{ width: 120 }} />
          <button className="btn btn-primary btn-sm" onClick={() => run(() => reportsApi.vehiclesByDriver(r2DriverId), setR2, setR2L, setR2E)}>▶ Run</button>
        </div>
        <ReportTable data={r2} loading={r2L} error={r2E} />
      </ReportSection>

      {/* R3 */}
      <ReportSection title="Vehicles with Expired Registrations as of Date" icon="📋">
        <div className="filter-bar" style={{ marginBottom: 12 }}>
          <input className="filter-select" type="date" value={r3Date} onChange={e => setR3Date(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={() => run(() => reportsApi.expiredRegistrations(r3Date), setR3, setR3L, setR3E)}>▶ Run</button>
        </div>
        <ReportTable data={r3} loading={r3L} error={r3E} />
      </ReportSection>

      {/* R4 */}
      <ReportSection title="Drivers with Expired or Suspended Licenses" icon="🚫">
        <div className="filter-bar" style={{ marginBottom: 12 }}>
          <button className="btn btn-primary btn-sm" onClick={() => run(() => reportsApi.expiredLicenses(), setR4, setR4L, setR4E)}>▶ Run Report</button>
        </div>
        <ReportTable data={r4} loading={r4L} error={r4E} />
      </ReportSection>

      {/* R5 */}
      <ReportSection title="Violations by Driver within Date Range" icon="⚠️">
        <div className="filter-bar" style={{ marginBottom: 12 }}>
          <input className="filter-select" placeholder="Driver ID" value={r5DriverId} onChange={e => setR5DriverId(e.target.value)} style={{ width: 120 }} />
          <input className="filter-select" type="date" value={r5From} onChange={e => setR5From(e.target.value)} />
          <input className="filter-select" type="date" value={r5To} onChange={e => setR5To(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={() => run(() => reportsApi.violationsByDriver(r5DriverId, { from: r5From, to: r5To }), setR5, setR5L, setR5E)}>▶ Run</button>
        </div>
        <ReportTable data={r5} loading={r5L} error={r5E} />
      </ReportSection>

      {/* R6 */}
      <ReportSection title="Total Violations per Type for a Given Year" icon="📈">
        <div className="filter-bar" style={{ marginBottom: 12 }}>
          <input className="filter-select" type="number" placeholder="Year" value={r6Year} onChange={e => setR6Year(e.target.value)} style={{ width: 100 }} min="2000" max="2099" />
          <button className="btn btn-primary btn-sm" onClick={() => run(() => reportsApi.violationsByType(r6Year), setR6, setR6L, setR6E)}>▶ Run</button>
        </div>
        <ReportTable data={r6} loading={r6L} error={r6E} />
      </ReportSection>

      {/* R7 */}
      <ReportSection title="Vehicles Involved in Violations by City / Region" icon="📍">
        <div className="filter-bar" style={{ marginBottom: 12 }}>
          <input className="filter-select" placeholder="City or Region (e.g. Quezon City)" value={r7Location} onChange={e => setR7Location(e.target.value)} style={{ width: 260 }} />
          <button className="btn btn-primary btn-sm" onClick={() => run(() => reportsApi.vehiclesInViolations(r7Location), setR7, setR7L, setR7E)}>▶ Run</button>
        </div>
        <ReportTable data={r7} loading={r7L} error={r7E} />
      </ReportSection>
    </div>
  );
}
