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

export default function Sidebar() {
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
          File Processing & Database Systems
        </div>
      </div>
    </aside>
  );
}
