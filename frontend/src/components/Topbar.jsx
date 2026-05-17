const pageTitles = {
  '/': { title: 'Dashboard', sub: 'Overview · LTO Management System' },
  '/drivers': { title: 'Driver Management', sub: 'Records · Licenses · Status' },
  '/vehicles': { title: 'Vehicle Management', sub: 'Fleet · Registration · Ownership' },
  '/registrations': { title: 'Vehicle Registration', sub: 'Active · Renewals · History' },
  '/violations': { title: 'Traffic Violations', sub: 'Tickets · Fines · Enforcement' },
  '/reports': { title: 'Reports & Analytics', sub: 'SQL Queries · Data Insights' },
};

export default function Topbar({ pathname, onLogout }) {
  const page = pageTitles[pathname] || pageTitles['/'];
  const now = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header className="topbar">
      <div style={{ flex: 1 }}>
        <div className="topbar-title">{page.title}</div>
        <span className="topbar-breadcrumb">{page.sub}</span>
      </div>

      <div style={{ fontSize: 11, color: 'var(--lto-text-muted)', textAlign: 'right' }}>
        <div style={{ fontWeight: 600 }}>{now}</div>
        <div style={{ marginTop: 2, color: 'var(--lto-blue)', fontWeight: 500, fontSize: 10 }}>
          NCR · Metro Manila
        </div>
      </div>

      <div className="topbar-badge">🇵🇭 LTO</div>
    </header>
  );
}