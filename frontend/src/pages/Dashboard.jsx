import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { driversApi, vehiclesApi, violationsApi, registrationsApi } from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ drivers: '—', vehicles: '—', violations: '—', registrations: '—' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      driversApi.getAll(),
      vehiclesApi.getAll(),
      violationsApi.getAll(),
      registrationsApi.getAll(),
    ]).then(([d, v, vio, r]) => {
      setStats({
      drivers: d.status === 'fulfilled' ? (d.value.data?.length ?? d.value.data?.data?.length ?? 0) : 'ERR',
      vehicles: v.status === 'fulfilled' ? (v.value.data?.length ?? v.value.data?.data?.length ?? 0) : 'ERR',
      violations: vio.status === 'fulfilled' ? (vio.value.data?.length ?? vio.value.data?.data?.length ?? 0) : 'ERR',
      registrations: r.status === 'fulfilled' ? (r.value.data?.length ?? r.value.data?.data?.length ?? 0) : 'ERR',
    });

      setLoading(false);
    });
  }, []);

  const quickActions = [
    { label: 'Add New Driver', icon: '👤', to: '/drivers', color: 'blue' },
    { label: 'Register Vehicle', icon: '🚗', to: '/vehicles', color: 'blue' },
    { label: 'New Registration', icon: '📋', to: '/registrations', color: 'yellow' },
    { label: 'File Violation', icon: '⚠️', to: '/violations', color: 'red' },
    { label: 'View Reports', icon: '📊', to: '/reports', color: 'green' },
  ];

  return (
    <div className="page-content fade-in">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--lto-blue) 0%, var(--lto-blue-light) 60%, var(--lto-red) 100%)',
        borderRadius: 12,
        padding: '28px 32px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
      }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', paddingRight: 32, opacity: 0.08, fontSize: 120, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: -4 }}>LTO</div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, var(--lto-yellow), transparent)' }} />
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>
          🇵🇭 LTO Information Management System
        </div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>
          Land Transportation Office · Republic of the Philippines · CMSC 127 Project
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card blue" style={{ cursor: 'pointer' }} onClick={() => navigate('/drivers')}>
          <div className="stat-icon blue">👤</div>
          <div className="stat-info">
            <div className="stat-value">{loading ? '...' : stats.drivers}</div>
            <div className="stat-label">Registered Drivers</div>
          </div>
        </div>
        <div className="stat-card blue" style={{ cursor: 'pointer' }} onClick={() => navigate('/vehicles')}>
          <div className="stat-icon blue">🚗</div>
          <div className="stat-info">
            <div className="stat-value">{loading ? '...' : stats.vehicles}</div>
            <div className="stat-label">Registered Vehicles</div>
          </div>
        </div>
        <div className="stat-card red" style={{ cursor: 'pointer' }} onClick={() => navigate('/violations')}>
          <div className="stat-icon red">⚠️</div>
          <div className="stat-info">
            <div className="stat-value">{loading ? '...' : stats.violations}</div>
            <div className="stat-label">Traffic Violations</div>
          </div>
        </div>
        <div className="stat-card yellow" style={{ cursor: 'pointer' }} onClick={() => navigate('/registrations')}>
          <div className="stat-icon yellow">📋</div>
          <div className="stat-info">
            <div className="stat-value">{loading ? '...' : stats.registrations}</div>
            <div className="stat-label">Registrations</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section-title">Quick Actions</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        {quickActions.map((a) => (
          <button key={a.to} className={`btn btn-${a.color === 'red' ? 'danger' : a.color === 'yellow' ? 'yellow' : 'primary'}`}
            onClick={() => navigate(a.to)}
            style={{ padding: '12px 20px', fontSize: 14 }}>
            <span>{a.icon}</span> {a.label}
          </button>
        ))}
      </div>

      {/* Info Section */}
      <div className="section-title">System Modules</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {[
          { icon: '👤', title: 'Driver Management', desc: 'Manage driver records, license types, status tracking, and personal information.', to: '/drivers' },
          { icon: '🚗', title: 'Vehicle Management', desc: 'Register vehicles, track ownership, manage plate numbers and vehicle details.', to: '/vehicles' },
          { icon: '📋', title: 'Registration', desc: 'Process vehicle registrations, renewals, and track registration history.', to: '/registrations' },
          { icon: '⚠️', title: 'Traffic Violations', desc: 'Record and manage traffic violations, fines, and enforcement actions.', to: '/violations' },
          { icon: '📊', title: 'Reports', desc: 'Generate SQL-based reports and analytics across all LTO data modules.', to: '/reports' },
        ].map((mod) => (
          <div key={mod.to} className="stat-card blue" style={{ flexDirection: 'column', gap: 10, cursor: 'pointer', padding: '20px' }} onClick={() => navigate(mod.to)}>
            <div style={{ fontSize: 28 }}>{mod.icon}</div>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--lto-blue)', marginBottom: 4 }}>{mod.title}</div>
              <div style={{ fontSize: 12, color: 'var(--lto-text-muted)', lineHeight: 1.5 }}>{mod.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
