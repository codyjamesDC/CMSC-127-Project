import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠', exact: true },
  { section: 'Management' },
  { to: '/drivers', label: 'Driver Management', icon: '👤' },
  { to: '/vehicles', label: 'Vehicle Management', icon: '🚗' },
  { to: '/registrations', label: 'Vehicle Registration', icon: '📋' },
  { to: '/violations', label: 'Traffic Violations', icon: '⚠️' },
  { section: 'Analytics' },
  { to: '/reports', label: 'Reports', icon: '📊' },
];

export default function Sidebar({ onLogout }) {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">LTO</div>
          <div className="sidebar-brand">
            <div className="sidebar-brand-name">LTO PORTAL</div>
            <div className="sidebar-brand-sub">Information Management System</div>
          </div>
        </div>
        <div className="sidebar-tagline">Land Transportation Office · Republic of the Philippines</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return <div key={i} className="nav-section-label">{item.section}</div>;
          }
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to) && item.to !== '/';
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-text">
          CMSC 127 · AY 2025–2026<br />
          File Processing &amp; Database Systems
        </div>
        {/* Logout button */}
        <button
          onClick={onLogout}
          style={{
            marginTop: 12,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '9px 0',
            background: 'rgba(214,63,63,0.10)',
            border: '1px solid rgba(214,63,63,0.22)',
            borderRadius: 8,
            color: '#c0392b',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(214,63,63,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(214,63,63,0.10)'}
        >
          <span style={{ fontSize: 15 }}>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}